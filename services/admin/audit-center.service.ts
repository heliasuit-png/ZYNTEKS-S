import "server-only";

import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { assertAdminPermission } from "@/services/admin/permissions";
import type {
  AuditCategory,
  AuditCenterData,
  AuditEventDetail,
  AuditEventRow,
  AuditFilters,
  AuditNamedCount,
  AuditRange,
  AuditResult,
  AuditSeverity,
  AuditTargetType,
} from "@/services/admin/audit-center.types";
import type { AdminPlatformRole } from "@/services/admin/types";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { AdminAuditAction, Json } from "@/types/database";

const ALL_ACTIONS: readonly AdminAuditAction[] = [
  "user_promoted",
  "user_demoted",
  "user_suspended",
  "user_reactivated",
  "user_password_reset",
  "user_force_logout",
  "user_deleted",
  "workspace_transferred",
  "workspace_suspended",
  "workspace_reactivated",
  "workspace_archived",
  "workspace_deleted",
  "workspace_renamed",
  "workspace_member_removed",
  "workspace_member_promoted",
  "workspace_member_demoted",
  "feature_flag_updated",
  "platform_settings_updated",
  "auth_login_suspicious",
  "auth_oauth_linked",
] as const;

const SECURITY_ACTIONS = new Set<AdminAuditAction>([
  "user_suspended",
  "user_force_logout",
  "user_password_reset",
  "user_deleted",
  "workspace_suspended",
  "auth_login_suspicious",
  "auth_oauth_linked",
]);

const SYSTEM_ACTIONS = new Set<AdminAuditAction>([
  "feature_flag_updated",
  "platform_settings_updated",
]);

const ADMIN_PRIVILEGE_ACTIONS = new Set<AdminAuditAction>([
  "user_promoted",
  "user_demoted",
]);

/** Documented retention — no automated purge exists in the schema. */
export const ADMIN_AUDIT_RETENTION_POLICY =
  "Indefinite retention. admin_audit_logs has no automated purge job configured.";

function rangeToMs(range: AuditRange): number | null {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
    case "all":
      return null;
  }
}

function resolveWindow(filters: AuditFilters): {
  since: string | null;
  until: string;
} {
  const until = filters.to?.trim()
    ? new Date(filters.to).toISOString()
    : new Date().toISOString();
  if (filters.from?.trim()) {
    return { since: new Date(filters.from).toISOString(), until };
  }
  const range = filters.range ?? "30d";
  const ms = rangeToMs(range);
  if (ms == null) return { since: null, until };
  return { since: new Date(Date.now() - ms).toISOString(), until };
}

export function auditActionSeverity(action: AdminAuditAction): AuditSeverity {
  switch (action) {
    case "user_deleted":
    case "workspace_deleted":
      return "critical";
    case "user_suspended":
    case "user_force_logout":
    case "workspace_suspended":
    case "auth_login_suspicious":
      return "high";
    case "user_password_reset":
    case "workspace_transferred":
    case "workspace_member_removed":
    case "platform_settings_updated":
    case "auth_oauth_linked":
      return "medium";
    default:
      return "low";
  }
}

export function auditActionCategory(action: AdminAuditAction): AuditCategory {
  if (SECURITY_ACTIONS.has(action)) return "security";
  if (SYSTEM_ACTIONS.has(action)) return "system";
  if (action.startsWith("workspace_")) return "workspace";
  if (ADMIN_PRIVILEGE_ACTIONS.has(action)) return "admin";
  if (action.startsWith("user_")) return "user";
  return "admin";
}

export function auditActionLabel(action: AdminAuditAction): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asRecord(value: Json | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringFromMeta(
  meta: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function resolveResult(meta: Record<string, unknown> | null): AuditResult {
  const raw = stringFromMeta(meta, ["result", "status", "outcome"]);
  if (!raw) return "success";
  const normalized = raw.toLowerCase();
  if (["fail", "failed", "failure", "error"].includes(normalized)) {
    return "failure";
  }
  if (["ok", "success", "succeeded", "completed"].includes(normalized)) {
    return "success";
  }
  return "unknown";
}

function resolveTargetType(
  action: AdminAuditAction,
  targetUserId: string | null,
  targetWorkspaceId: string | null,
  meta: Record<string, unknown> | null,
): AuditTargetType {
  if (action === "feature_flag_updated") return "feature_flag";
  if (action === "platform_settings_updated") return "platform_settings";
  if (action === "user_force_logout" && stringFromMeta(meta, ["sessionId"])) {
    return "session";
  }
  if (targetWorkspaceId || action.startsWith("workspace_")) return "workspace";
  if (targetUserId || action.startsWith("user_")) return "user";
  return "unknown";
}

function extractPreviousState(meta: Record<string, unknown> | null): Json | null {
  if (!meta) return null;
  if ("previous" in meta) return meta.previous as Json;
  if ("previousStatus" in meta || "previousRole" in meta || "previousName" in meta) {
    const state: { [key: string]: Json | undefined } = {};
    if ("previousStatus" in meta) state.status = meta.previousStatus as Json;
    if ("previousRole" in meta) state.role = meta.previousRole as Json;
    if ("previousName" in meta) state.name = meta.previousName as Json;
    if ("previousOwnerId" in meta) state.ownerId = meta.previousOwnerId as Json;
    return state as Json;
  }
  return null;
}

function extractNewState(meta: Record<string, unknown> | null): Json | null {
  if (!meta) return null;
  if ("next" in meta) return meta.next as Json;
  if ("status" in meta || "platformRole" in meta || "name" in meta) {
    const state: { [key: string]: Json | undefined } = {};
    if ("status" in meta) state.status = meta.status as Json;
    if ("platformRole" in meta) state.platformRole = meta.platformRole as Json;
    if ("name" in meta) state.name = meta.name as Json;
    if ("role" in meta && !("previousRole" in meta && meta.role === meta.previousRole)) {
      state.role = meta.role as Json;
    }
    return Object.keys(state).length ? (state as Json) : null;
  }
  return null;
}

function topCounts(
  map: Map<string, { label: string; count: number }>,
  limit: number,
): AuditNamedCount[] {
  return [...map.entries()]
    .map(([key, value]) => ({ key, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function matchesSearch(
  row: {
    summary: string;
    action: string;
    actorEmail: string | null;
    actorName: string | null;
    targetName: string | null;
    workspaceName: string | null;
    projectName: string | null;
  },
  q: string,
): boolean {
  const needle = q.toLowerCase();
  return [
    row.summary,
    row.action,
    row.actorEmail,
    row.actorName,
    row.targetName,
    row.workspaceName,
    row.projectName,
  ].some((value) => value?.toLowerCase().includes(needle));
}

type LogRow = {
  id: string;
  actor_id: string | null;
  action: AdminAuditAction;
  target_user_id: string | null;
  target_workspace_id: string | null;
  summary: string;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
};

async function hydrateEvents(
  logs: LogRow[],
): Promise<AuditEventRow[]> {
  if (logs.length === 0) return [];

  const admin = createSupabaseAdminClient();
  const actorIds = [
    ...new Set(logs.map((row) => row.actor_id).filter(Boolean)),
  ] as string[];
  const userIds = [
    ...new Set(
      [
        ...logs.map((row) => row.target_user_id),
        ...logs.map((row) => row.actor_id),
      ].filter(Boolean),
    ),
  ] as string[];
  const workspaceIds = [
    ...new Set(
      logs.map((row) => row.target_workspace_id).filter(Boolean),
    ),
  ] as string[];

  const projectIds = new Set<string>();
  for (const row of logs) {
    const meta = asRecord(row.metadata);
    const projectId = stringFromMeta(meta, ["projectId", "project_id"]);
    if (projectId) projectIds.add(projectId);
  }

  const [profilesRes, adminUsersRes, workspacesRes, projectsRes] =
    await Promise.all([
      userIds.length
        ? admin
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      actorIds.length
        ? admin
            .from("admin_users")
            .select("user_id, role")
            .in("user_id", actorIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length
        ? admin.from("workspaces").select("id, name").in("id", workspaceIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.size
        ? admin
            .from("projects")
            .select("id, name, workspace_id")
            .in("id", [...projectIds])
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (profilesRes.error) throw mapPostgrestError(profilesRes.error);
  if (adminUsersRes.error) throw mapPostgrestError(adminUsersRes.error);
  if (workspacesRes.error) throw mapPostgrestError(workspacesRes.error);
  if (projectsRes.error) throw mapPostgrestError(projectsRes.error);

  const profiles = new Map(
    (profilesRes.data ?? []).map((row) => [
      row.id,
      { email: row.email, name: row.full_name },
    ]),
  );
  const roles = new Map(
    (adminUsersRes.data ?? []).map((row) => [row.user_id, row.role]),
  );
  const workspaces = new Map(
    (workspacesRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const projects = new Map(
    (projectsRes.data ?? []).map((row) => [
      row.id,
      { name: row.name, workspaceId: row.workspace_id },
    ]),
  );

  return logs.map((row) => {
    const meta = asRecord(row.metadata);
    const projectId = stringFromMeta(meta, ["projectId", "project_id"]);
    const project = projectId ? projects.get(projectId) : undefined;
    const workspaceId =
      row.target_workspace_id ??
      project?.workspaceId ??
      stringFromMeta(meta, ["workspaceId", "workspace_id"]);
    const workspaceName = workspaceId
      ? (workspaces.get(workspaceId) ?? null)
      : null;

    const targetType = resolveTargetType(
      row.action,
      row.target_user_id,
      row.target_workspace_id,
      meta,
    );

    let targetName: string | null = null;
    if (targetType === "user" && row.target_user_id) {
      const profile = profiles.get(row.target_user_id);
      targetName = profile?.name || profile?.email || row.target_user_id;
    } else if (targetType === "workspace" && workspaceId) {
      targetName = workspaceName ?? workspaceId;
    } else if (targetType === "feature_flag") {
      targetName =
        stringFromMeta(meta, ["key", "flagKey", "name"]) ?? "Feature flag";
    } else if (targetType === "platform_settings") {
      targetName = "Platform settings";
    } else if (targetType === "session") {
      targetName = stringFromMeta(meta, ["sessionId"]) ?? "Session";
    }

    const actorProfile = row.actor_id ? profiles.get(row.actor_id) : undefined;

    return {
      id: row.id,
      timestamp: row.created_at,
      actorId: row.actor_id,
      actorEmail: actorProfile?.email ?? null,
      actorName: actorProfile?.name ?? null,
      actorRole: row.actor_id ? (roles.get(row.actor_id) ?? null) : null,
      action: row.action,
      actionLabel: auditActionLabel(row.action),
      category: auditActionCategory(row.action),
      targetType,
      targetName,
      targetUserId: row.target_user_id,
      targetWorkspaceId: row.target_workspace_id,
      workspaceId: workspaceId ?? null,
      workspaceName,
      projectId: projectId ?? null,
      projectName: project?.name ?? null,
      severity: auditActionSeverity(row.action),
      ipAddress: row.ip_address,
      result: resolveResult(meta),
      summary: row.summary,
      metadata: row.metadata ?? {},
    };
  });
}

function applyClientFilters(
  events: AuditEventRow[],
  filters: AuditFilters,
): AuditEventRow[] {
  return events.filter((event) => {
    if (filters.severity && event.severity !== filters.severity) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.actorRole && event.actorRole !== filters.actorRole) return false;
    if (filters.result && event.result !== filters.result) return false;
    if (filters.projectId && event.projectId !== filters.projectId) return false;
    if (filters.q?.trim() && !matchesSearch(event, filters.q.trim())) {
      return false;
    }
    return true;
  });
}

export async function getEnterpriseAuditCenter(
  role: AdminPlatformRole,
  filters: AuditFilters = {},
): Promise<AuditCenterData> {
  assertAdminPermission(role, "admin:audit:read");

  const admin = createSupabaseAdminClient();
  const { since, until } = resolveWindow(filters);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 50));
  const unavailable: string[] = [];

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const todayIso = startOfToday.toISOString();
  const securityActionList = [...SECURITY_ACTIONS];
  const adminActionList = [...ADMIN_PRIVILEGE_ACTIONS];
  const systemActionList = [...SYSTEM_ACTIONS];
  const userActionList = ALL_ACTIONS.filter((action) =>
    action.startsWith("user_"),
  );
  const workspaceActionList = ALL_ACTIONS.filter((action) =>
    action.startsWith("workspace_"),
  );

  const [
    totalRes,
    todayRes,
    weekRes,
    securityRes,
    adminRes,
    workspaceRes,
    userRes,
    systemRes,
  ] = await Promise.all([
    admin.from("admin_audit_logs").select("id", { count: "exact", head: true }),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", securityActionList),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", adminActionList),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", workspaceActionList),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", userActionList),
    admin
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .in("action", systemActionList),
  ]);

  for (const res of [
    totalRes,
    todayRes,
    weekRes,
    securityRes,
    adminRes,
    workspaceRes,
    userRes,
    systemRes,
  ]) {
    if (res.error) throw mapPostgrestError(res.error);
  }

  const overview: AuditCenterData["overview"] = {
    totalEvents: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    securityEvents: securityRes.count ?? 0,
    adminActions: adminRes.count ?? 0,
    workspaceActions: workspaceRes.count ?? 0,
    userActions: userRes.count ?? 0,
    systemActions: systemRes.count ?? 0,
  };

  let listQuery = admin
    .from("admin_audit_logs")
    .select(
      "id, actor_id, action, target_user_id, target_workspace_id, summary, metadata, ip_address, created_at",
    )
    .lte("created_at", until)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (since) listQuery = listQuery.gte("created_at", since);
  if (filters.workspaceId) {
    listQuery = listQuery.eq("target_workspace_id", filters.workspaceId);
  }
  if (filters.action) {
    listQuery = listQuery.eq("action", filters.action);
  }

  const q = filters.q?.trim();
  if (q) {
    const safeQ = q.replace(/[%_,.()]/g, " ").trim();
    if (safeQ) {
      const [{ data: matchedProfiles }, { data: matchedWorkspaces }, { data: matchedProjects }] =
        await Promise.all([
          admin
            .from("profiles")
            .select("id")
            .or(`email.ilike.%${safeQ}%,full_name.ilike.%${safeQ}%`)
            .limit(100),
          admin
            .from("workspaces")
            .select("id")
            .ilike("name", `%${safeQ}%`)
            .limit(50),
          admin
            .from("projects")
            .select("id")
            .ilike("name", `%${safeQ}%`)
            .limit(50),
        ]);

      const clauses = [`summary.ilike.%${safeQ}%`];
      const matchedActions = ALL_ACTIONS.filter((action) =>
        action.includes(safeQ.toLowerCase().replace(/\s+/g, "_")),
      );
      if (matchedActions.length > 0) {
        clauses.push(`action.in.(${matchedActions.join(",")})`);
      }
      const matchedUserIds = (matchedProfiles ?? []).map((row) => row.id);
      const matchedWorkspaceIds = (matchedWorkspaces ?? []).map((row) => row.id);
      if (matchedUserIds.length > 0) {
        const idList = matchedUserIds.join(",");
        clauses.push(`actor_id.in.(${idList})`, `target_user_id.in.(${idList})`);
      }
      if (matchedWorkspaceIds.length > 0) {
        clauses.push(
          `target_workspace_id.in.(${matchedWorkspaceIds.join(",")})`,
        );
      }
      // Project matches are applied after hydration (project lives in metadata).
      if ((matchedProjects ?? []).length > 0) {
        unavailable.push("project_name_search_post_filter");
      }
      listQuery = listQuery.or(clauses.join(","));
    }
  }

  const { data: logRows, error: listError } = await listQuery;
  if (listError) throw mapPostgrestError(listError);
  if ((logRows?.length ?? 0) >= 2000) {
    unavailable.push("filter_window_truncated_at_2000");
  }

  const hydrated = await hydrateEvents((logRows ?? []) as LogRow[]);
  const filtered = applyClientFilters(hydrated, filters);
  const totalFiltered = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pageCount);
  const events = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const timeline = filtered.slice(0, 40);

  // Insights over filtered window (not just current page)
  const actionMap = new Map<string, { label: string; count: number }>();
  const adminMap = new Map<string, { label: string; count: number }>();
  const workspaceMap = new Map<string, { label: string; count: number }>();
  const userMap = new Map<string, { label: string; count: number }>();
  const securityMap = new Map<string, { label: string; count: number }>();

  for (const event of filtered) {
    const actionEntry = actionMap.get(event.action) ?? {
      label: event.actionLabel,
      count: 0,
    };
    actionEntry.count += 1;
    actionMap.set(event.action, actionEntry);

    if (event.actorId) {
      const label =
        event.actorEmail || event.actorName || event.actorId.slice(0, 8);
      const entry = adminMap.get(event.actorId) ?? { label, count: 0 };
      entry.count += 1;
      adminMap.set(event.actorId, entry);
    }

    if (event.workspaceId) {
      const label = event.workspaceName || event.workspaceId.slice(0, 8);
      const entry = workspaceMap.get(event.workspaceId) ?? { label, count: 0 };
      entry.count += 1;
      workspaceMap.set(event.workspaceId, entry);
    }

    if (event.targetUserId) {
      const label = event.targetName || event.targetUserId.slice(0, 8);
      const entry = userMap.get(event.targetUserId) ?? { label, count: 0 };
      entry.count += 1;
      userMap.set(event.targetUserId, entry);
    }

    if (event.category === "security") {
      const entry = securityMap.get(event.action) ?? {
        label: event.actionLabel,
        count: 0,
      };
      entry.count += 1;
      securityMap.set(event.action, entry);
    }
  }

  const [{ data: oldest }, { data: newest }, workspacesRes, projectsRes] =
    await Promise.all([
      admin
        .from("admin_audit_logs")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      admin
        .from("admin_audit_logs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("workspaces").select("id, name").order("name").limit(500),
      admin
        .from("projects")
        .select("id, name, workspace_id")
        .order("name")
        .limit(1000),
    ]);

  if (workspacesRes.error) throw mapPostgrestError(workspacesRes.error);
  if (projectsRes.error) throw mapPostgrestError(projectsRes.error);

  unavailable.push("project_filter_requires_metadata");

  return {
    overview,
    events,
    timeline,
    insights: {
      mostCommonActions: topCounts(actionMap, 8),
      mostActiveAdmins: topCounts(adminMap, 8),
      mostModifiedWorkspaces: topCounts(workspaceMap, 8),
      mostModifiedUsers: topCounts(userMap, 8),
      topSecurityEvents: topCounts(securityMap, 8),
    },
    retention: {
      policy: ADMIN_AUDIT_RETENTION_POLICY,
      policyDays: null,
      storedRecords: overview.totalEvents,
      oldestRecordAt: oldest?.created_at ?? null,
      newestRecordAt: newest?.created_at ?? null,
      note: "Retention days are not configured in the database. Records remain until manually removed by operators.",
    },
    totalFiltered,
    page: safePage,
    pageSize,
    pageCount,
    filters: {
      ...filters,
      range: filters.range ?? "30d",
      page: safePage,
      pageSize,
    },
    filterOptions: {
      workspaces: (workspacesRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
      })),
      projects: (projectsRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        workspaceId: row.workspace_id,
      })),
      actions: [...ALL_ACTIONS],
      actorRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "READ_ONLY"],
    },
    unavailable,
  };
}

export async function getAuditEventDetail(
  role: AdminPlatformRole,
  eventId: string,
): Promise<AuditEventDetail> {
  assertAdminPermission(role, "admin:audit:read");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_audit_logs")
    .select(
      "id, actor_id, action, target_user_id, target_workspace_id, summary, metadata, ip_address, created_at",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!data) throw new NotFoundError("Audit event not found");

  const [event] = await hydrateEvents([data as LogRow]);
  if (!event) throw new NotFoundError("Audit event not found");

  const meta = asRecord(event.metadata);
  const relatedEntities: AuditEventDetail["relatedEntities"] = [];
  if (event.actorId) {
    relatedEntities.push({
      kind: "actor",
      id: event.actorId,
      label: event.actorEmail || event.actorName || event.actorId,
    });
  }
  if (event.targetUserId) {
    relatedEntities.push({
      kind: "user",
      id: event.targetUserId,
      label: event.targetName || event.targetUserId,
    });
  }
  if (event.workspaceId) {
    relatedEntities.push({
      kind: "workspace",
      id: event.workspaceId,
      label: event.workspaceName || event.workspaceId,
    });
  }
  if (event.projectId) {
    relatedEntities.push({
      kind: "project",
      id: event.projectId,
      label: event.projectName || event.projectId,
    });
  }
  const flagId = stringFromMeta(meta, ["flagId"]);
  if (flagId) {
    relatedEntities.push({
      kind: "feature_flag",
      id: flagId,
      label: stringFromMeta(meta, ["key"]) || flagId,
    });
  }
  const sessionId = stringFromMeta(meta, ["sessionId"]);
  if (sessionId) {
    relatedEntities.push({
      kind: "session",
      id: sessionId,
      label: sessionId,
    });
  }

  return {
    ...event,
    previousState: extractPreviousState(meta),
    newState: extractNewState(meta),
    relatedEntities,
  };
}

export async function exportAuditJson(
  role: AdminPlatformRole,
  filters: AuditFilters,
): Promise<string> {
  const data = await getEnterpriseAuditCenter(role, {
    ...filters,
    page: 1,
    pageSize: 2000,
  });
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      filters: data.filters,
      overview: data.overview,
      retention: data.retention,
      insights: data.insights,
      events: data.events,
      unavailable: data.unavailable,
    },
    null,
    2,
  );
}

export async function exportAuditCsv(
  role: AdminPlatformRole,
  filters: AuditFilters,
): Promise<string> {
  const data = await getEnterpriseAuditCenter(role, {
    ...filters,
    page: 1,
    pageSize: 2000,
  });

  const header = [
    "timestamp",
    "actor_email",
    "actor_role",
    "action",
    "category",
    "target_type",
    "target_name",
    "workspace",
    "project",
    "severity",
    "ip_address",
    "result",
    "summary",
  ];

  const lines = [header.join(",")];
  for (const event of data.events) {
    lines.push(
      [
        event.timestamp,
        event.actorEmail,
        event.actorRole,
        event.action,
        event.category,
        event.targetType,
        event.targetName,
        event.workspaceName,
        event.projectName,
        event.severity,
        event.ipAddress,
        event.result,
        event.summary,
      ]
        .map((cell) => csvEscape(cell))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
