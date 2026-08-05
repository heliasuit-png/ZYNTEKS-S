import "server-only";

import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { clamp, round } from "@/services/health/math";
import { listAdminAuditForWorkspace } from "@/services/admin/admin-audit.service";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AdminWorkspaceDetail,
  AdminWorkspaceListItem,
  WorkspacesListFilters,
  WorkspacesListResult,
  WorkspacesOverviewStats,
  WorkspacesSortField,
  WorkspaceAnalyticsPoint,
} from "@/services/admin/workspaces.types";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type {
  SubscriptionPlan,
  WorkspaceAdminStatus,
} from "@/types/database";

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function dayLabel(iso: string): string {
  return iso.slice(0, 10);
}

function emptyBuckets(days: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  return map;
}

async function storageBytesForWorkspace(
  workspaceId: string,
): Promise<number> {
  const admin = createSupabaseAdminClient();
  try {
    const { data, error } = await admin.storage
      .from("workspace-logos")
      .list(workspaceId, { limit: 100 });
    if (error || !data) return 0;
    return data.reduce((sum, file) => {
      const size =
        typeof file.metadata?.size === "number"
          ? file.metadata.size
          : Number(file.metadata?.size ?? 0);
      return sum + (Number.isFinite(size) ? size : 0);
    }, 0);
  } catch {
    return 0;
  }
}

async function loadOverview(): Promise<WorkspacesOverviewStats> {
  const admin = createSupabaseAdminClient();
  const today = startOfUtcDayIso();
  const since30d = daysAgoIso(30);

  const [
    allWorkspaces,
    newToday,
    active,
    enterprise,
    members,
    projects,
    apiKeys,
  ] = await Promise.all([
    admin.from("workspaces").select("id, owner_id, plan, admin_status"),
    admin
      .from("workspaces")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    admin
      .from("workspaces")
      .select("id", { count: "exact", head: true })
      .eq("admin_status", "active"),
    admin
      .from("workspaces")
      .select("id", { count: "exact", head: true })
      .eq("plan", "enterprise"),
    admin.from("workspace_members").select("workspace_id"),
    admin.from("projects").select("id, workspace_id"),
    admin.from("api_keys").select("id, project_id"),
  ]);

  for (const result of [
    allWorkspaces,
    newToday,
    active,
    enterprise,
    members,
    projects,
    apiKeys,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const workspaceIds = (allWorkspaces.data ?? []).map((row) => row.id);
  const totalWorkspaces = workspaceIds.length;
  const memberCounts = new Map<string, number>();
  for (const row of members.data ?? []) {
    memberCounts.set(
      row.workspace_id,
      (memberCounts.get(row.workspace_id) ?? 0) + 1,
    );
  }
  const projectByWorkspace = new Map<string, string[]>();
  for (const row of projects.data ?? []) {
    const list = projectByWorkspace.get(row.workspace_id) ?? [];
    list.push(row.id);
    projectByWorkspace.set(row.workspace_id, list);
  }
  const projectToWorkspace = new Map<string, string>();
  for (const [wsId, ids] of projectByWorkspace) {
    for (const pid of ids) projectToWorkspace.set(pid, wsId);
  }
  const apiKeyByWorkspace = new Map<string, number>();
  for (const row of apiKeys.data ?? []) {
    const wsId = projectToWorkspace.get(row.project_id);
    if (!wsId) continue;
    apiKeyByWorkspace.set(wsId, (apiKeyByWorkspace.get(wsId) ?? 0) + 1);
  }

  const avg = (values: number[]) =>
    values.length === 0
      ? 0
      : Math.round(
          (values.reduce((a, b) => a + b, 0) / values.length) * 10,
        ) / 10;

  const memberValues = workspaceIds.map((id) => memberCounts.get(id) ?? 0);
  const projectValues = workspaceIds.map(
    (id) => projectByWorkspace.get(id)?.length ?? 0,
  );
  const keyValues = workspaceIds.map((id) => apiKeyByWorkspace.get(id) ?? 0);

  const memberIdsResult = await admin
    .from("workspace_members")
    .select("user_id");
  if (memberIdsResult.error) throw mapPostgrestError(memberIdsResult.error);
  const userIds = [
    ...new Set((memberIdsResult.data ?? []).map((row) => row.user_id)),
  ];

  let aiUsageTokens30d = 0;
  if (userIds.length > 0) {
    const { data: aiRows, error: aiError } = await admin
      .from("ai_usage")
      .select("total_tokens, user_id")
      .gte("created_at", since30d)
      .in("user_id", userIds.slice(0, 500));
    if (aiError) throw mapPostgrestError(aiError);
    aiUsageTokens30d = (aiRows ?? []).reduce(
      (sum, row) => sum + (row.total_tokens ?? 0),
      0,
    );
  }

  let storageBytes = 0;
  const sampleIds = workspaceIds.slice(0, 200);
  const sizes = await Promise.all(
    sampleIds.map((id) => storageBytesForWorkspace(id)),
  );
  storageBytes = sizes.reduce((a, b) => a + b, 0);

  return {
    totalWorkspaces,
    newToday: newToday.count ?? 0,
    activeWorkspaces: active.count ?? 0,
    enterprisePlans: enterprise.count ?? 0,
    averageMembers: avg(memberValues),
    averageProjects: avg(projectValues),
    averageApiKeys: avg(keyValues),
    aiUsageTokens30d,
    storageBytes,
  };
}

async function enrichWorkspaces(
  workspaceRows: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_color: string;
    owner_id: string;
    plan: SubscriptionPlan;
    admin_status: WorkspaceAdminStatus;
    created_at: string;
  }[],
): Promise<AdminWorkspaceListItem[]> {
  if (workspaceRows.length === 0) return [];
  const admin = createSupabaseAdminClient();
  const ids = workspaceRows.map((row) => row.id);
  const ownerIds = [...new Set(workspaceRows.map((row) => row.owner_id))];
  const since30d = daysAgoIso(30);

  const [owners, members, projects, sessions] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ownerIds),
    admin
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", ids),
    admin
      .from("projects")
      .select("id, workspace_id")
      .in("workspace_id", ids),
    admin
      .from("user_sessions")
      .select("user_id, country, last_active_at")
      .in("user_id", ownerIds)
      .order("last_active_at", { ascending: false })
      .limit(5000),
  ]);

  for (const result of [owners, members, projects, sessions]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const ownerMap = new Map(
    (owners.data ?? []).map((row) => [
      row.id,
      { email: row.email, fullName: row.full_name },
    ]),
  );
  const memberCount = new Map<string, number>();
  for (const row of members.data ?? []) {
    memberCount.set(
      row.workspace_id,
      (memberCount.get(row.workspace_id) ?? 0) + 1,
    );
  }
  const projectIdsByWs = new Map<string, string[]>();
  for (const row of projects.data ?? []) {
    const list = projectIdsByWs.get(row.workspace_id) ?? [];
    list.push(row.id);
    projectIdsByWs.set(row.workspace_id, list);
  }
  const allProjectIds = (projects.data ?? []).map((row) => row.id);

  const countryByOwner = new Map<string, string>();
  for (const row of sessions.data ?? []) {
    if (row.country && !countryByOwner.has(row.user_id)) {
      countryByOwner.set(row.user_id, row.country);
    }
  }

  let apiKeyCount = new Map<string, number>();
  let errorCount = new Map<string, number>();
  let incidentCount = new Map<string, number>();

  if (allProjectIds.length > 0) {
    const [keys, errors, incidents] = await Promise.all([
      admin
        .from("api_keys")
        .select("id, project_id")
        .in("project_id", allProjectIds),
      admin
        .from("error_events")
        .select("id, project_id")
        .in("project_id", allProjectIds)
        .gte("occurred_at", since30d)
        .limit(20000),
      admin
        .from("incidents")
        .select("id, project_id")
        .in("project_id", allProjectIds)
        .gte("detected_at", since30d)
        .limit(10000),
    ]);
    for (const result of [keys, errors, incidents]) {
      if (result.error) throw mapPostgrestError(result.error);
    }

    const projectToWs = new Map<string, string>();
    for (const [wsId, pids] of projectIdsByWs) {
      for (const pid of pids) projectToWs.set(pid, wsId);
    }

    apiKeyCount = new Map();
    for (const row of keys.data ?? []) {
      const wsId = projectToWs.get(row.project_id);
      if (!wsId) continue;
      apiKeyCount.set(wsId, (apiKeyCount.get(wsId) ?? 0) + 1);
    }
    errorCount = new Map();
    for (const row of errors.data ?? []) {
      const wsId = projectToWs.get(row.project_id);
      if (!wsId) continue;
      errorCount.set(wsId, (errorCount.get(wsId) ?? 0) + 1);
    }
    incidentCount = new Map();
    for (const row of incidents.data ?? []) {
      const wsId = projectToWs.get(row.project_id);
      if (!wsId) continue;
      incidentCount.set(wsId, (incidentCount.get(wsId) ?? 0) + 1);
    }
  }

  const storageSizes = await Promise.all(
    ids.map(async (id) => [id, await storageBytesForWorkspace(id)] as const),
  );
  const storageMap = new Map(storageSizes);

  return workspaceRows.map((row) => {
    const owner = ownerMap.get(row.owner_id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logo_url,
      brandColor: row.brand_color,
      ownerId: row.owner_id,
      ownerEmail: owner?.email ?? "—",
      ownerName: owner?.fullName ?? null,
      memberCount: memberCount.get(row.id) ?? 0,
      projectCount: projectIdsByWs.get(row.id)?.length ?? 0,
      apiKeyCount: apiKeyCount.get(row.id) ?? 0,
      errorCount30d: errorCount.get(row.id) ?? 0,
      incidentCount30d: incidentCount.get(row.id) ?? 0,
      plan: row.plan,
      storageBytes: storageMap.get(row.id) ?? 0,
      status: row.admin_status,
      country: countryByOwner.get(row.owner_id) ?? null,
      createdAt: row.created_at,
    };
  });
}

function sortItems(
  items: AdminWorkspaceListItem[],
  sort: WorkspacesSortField,
  ascending: boolean,
): AdminWorkspaceListItem[] {
  const dir = ascending ? 1 : -1;
  return [...items].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (sort) {
      case "name":
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case "owner":
        av = a.ownerEmail.toLowerCase();
        bv = b.ownerEmail.toLowerCase();
        break;
      case "members":
        av = a.memberCount;
        bv = b.memberCount;
        break;
      case "projects":
        av = a.projectCount;
        bv = b.projectCount;
        break;
      case "api_keys":
        av = a.apiKeyCount;
        bv = b.apiKeyCount;
        break;
      case "errors":
        av = a.errorCount30d;
        bv = b.errorCount30d;
        break;
      case "incidents":
        av = a.incidentCount30d;
        bv = b.incidentCount30d;
        break;
      case "plan":
        av = a.plan;
        bv = b.plan;
        break;
      case "storage":
        av = a.storageBytes;
        bv = b.storageBytes;
        break;
      case "status":
        av = a.status;
        bv = b.status;
        break;
      case "created_at":
      default:
        av = a.createdAt;
        bv = b.createdAt;
        break;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export async function listAdminWorkspaces(
  role: AdminPlatformRole,
  filters: WorkspacesListFilters = {},
): Promise<WorkspacesListResult> {
  assertAdminPermission(role, "admin:workspaces:read");
  const admin = createSupabaseAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

  let query = admin
    .from("workspaces")
    .select(
      "id, name, slug, logo_url, brand_color, owner_id, plan, admin_status, created_at",
    );

  if (filters.plan) {
    query = query.eq("plan", filters.plan as SubscriptionPlan);
  }
  if (filters.status) {
    query = query.eq("admin_status", filters.status as WorkspaceAdminStatus);
  }
  if (filters.createdFrom) {
    query = query.gte("created_at", filters.createdFrom);
  }
  if (filters.createdTo) {
    query = query.lte("created_at", filters.createdTo);
  }

  const { data: rows, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) throw mapPostgrestError(error);

  let items = await enrichWorkspaces(rows ?? []);

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.ownerEmail.toLowerCase().includes(q) ||
        (item.ownerName ?? "").toLowerCase().includes(q),
    );
  }

  if (filters.country?.trim()) {
    const country = filters.country.trim().toLowerCase();
    items = items.filter((item) =>
      (item.country ?? "").toLowerCase().includes(country),
    );
  }

  if (filters.storage === "with_logo") {
    items = items.filter((item) => Boolean(item.logoUrl) || item.storageBytes > 0);
  } else if (filters.storage === "no_logo") {
    items = items.filter((item) => !item.logoUrl && item.storageBytes === 0);
  }

  if (typeof filters.membersMin === "number") {
    const min = filters.membersMin;
    items = items.filter((item) => item.memberCount >= min);
  }
  if (typeof filters.membersMax === "number") {
    const max = filters.membersMax;
    items = items.filter((item) => item.memberCount <= max);
  }

  const sort = filters.sort ?? "created_at";
  const ascending = (filters.direction ?? "desc") === "asc";
  items = sortItems(items, sort, ascending);

  const total = items.length;
  const from = (page - 1) * pageSize;
  const pageItems = items.slice(from, from + pageSize);

  return {
    items: pageItems,
    total,
    page,
    pageSize,
    overview: await loadOverview(),
  };
}

function computeHealthScore(input: {
  errorCount30d: number;
  incidentCount30d: number;
  projectCount: number;
  heartbeatStatus: AdminWorkspaceDetail["heartbeatStatus"];
}): number | null {
  if (input.projectCount === 0) return null;
  let score = 100;
  const errorsPerProject = input.errorCount30d / Math.max(1, input.projectCount);
  if (errorsPerProject > 50) score -= 35;
  else if (errorsPerProject > 20) score -= 20;
  else if (errorsPerProject > 5) score -= 10;
  if (input.incidentCount30d > 10) score -= 30;
  else if (input.incidentCount30d > 3) score -= 15;
  else if (input.incidentCount30d > 0) score -= 5;
  if (input.heartbeatStatus === "silent") score -= 25;
  else if (input.heartbeatStatus === "degraded") score -= 10;
  else if (input.heartbeatStatus === "none") score -= 5;
  return clamp(round(score), 0, 100);
}

export async function getAdminWorkspaceDetail(
  role: AdminPlatformRole,
  workspaceId: string,
): Promise<AdminWorkspaceDetail> {
  assertAdminPermission(role, "admin:workspaces:read");
  const admin = createSupabaseAdminClient();
  const since30d = daysAgoIso(30);
  const since14d = daysAgoIso(14);

  const { data: workspace, error } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!workspace) throw new NotFoundError("Workspace not found");

  const listItems = await enrichWorkspaces([
    {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo_url: workspace.logo_url,
      brand_color: workspace.brand_color,
      owner_id: workspace.owner_id,
      plan: workspace.plan,
      admin_status: workspace.admin_status,
      created_at: workspace.created_at,
    },
  ]);
  const listItem = listItems[0]!;

  const [
    memberRows,
    invitationRows,
    projectRows,
    auditProduct,
    adminAudit,
  ] = await Promise.all([
    admin
      .from("workspace_members")
      .select("id, user_id, role, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    admin
      .from("workspace_invitations")
      .select("id, email, role, status, created_at, expires_at, accepted_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("projects")
      .select("id, name, slug, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    admin
      .from("audit_logs")
      .select("id, action, summary, created_at, actor_id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(40),
    listAdminAuditForWorkspace(workspaceId, 40),
  ]);

  for (const result of [
    memberRows,
    invitationRows,
    projectRows,
    auditProduct,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const memberUserIds = (memberRows.data ?? []).map((row) => row.user_id);
  const profiles =
    memberUserIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", memberUserIds)
      : { data: [], error: null };
  if (profiles.error) throw mapPostgrestError(profiles.error);
  const profileMap = new Map(
    (profiles.data ?? []).map((row) => [
      row.id,
      { email: row.email, fullName: row.full_name },
    ]),
  );

  const projectIds = (projectRows.data ?? []).map((row) => row.id);

  const [apiKeys, errors, incidents, heartbeats, aiUsage, notifications] =
    await Promise.all([
      projectIds.length
        ? admin
            .from("api_keys")
            .select(
              "id, name, key_prefix, status, environment, project_id, last_used_at",
            )
            .in("project_id", projectIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? admin
            .from("error_events")
            .select("id, message, level, occurred_at, project_id")
            .in("project_id", projectIds)
            .gte("occurred_at", since30d)
            .order("occurred_at", { ascending: false })
            .limit(2000)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? admin
            .from("incidents")
            .select("id, title, status, severity, detected_at, project_id")
            .in("project_id", projectIds)
            .gte("detected_at", since30d)
            .order("detected_at", { ascending: false })
            .limit(1000)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? admin
            .from("heartbeats")
            .select("project_id, occurred_at")
            .in("project_id", projectIds)
            .order("occurred_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      memberUserIds.length
        ? admin
            .from("ai_usage")
            .select("total_tokens, created_at, user_id")
            .in("user_id", memberUserIds)
            .gte("created_at", since30d)
            .limit(5000)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? admin
            .from("notification_queue")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
            .gte("created_at", since30d)
        : Promise.resolve({ count: 0, error: null }),
    ]);

  for (const result of [apiKeys, errors, incidents, heartbeats, aiUsage]) {
    if (result.error) throw mapPostgrestError(result.error);
  }
  if (notifications.error) throw mapPostgrestError(notifications.error);

  const heartbeatRows = heartbeats.data ?? [];
  let heartbeatStatus: AdminWorkspaceDetail["heartbeatStatus"] = "none";
  let lastHeartbeatAt: string | null = null;
  if (projectIds.length === 0) {
    heartbeatStatus = "none";
  } else if (heartbeatRows.length === 0) {
    heartbeatStatus = "silent";
  } else {
    const times = heartbeatRows
      .map((row) => row.occurred_at)
      .filter(Boolean)
      .map((iso) => new Date(iso).getTime());
    lastHeartbeatAt =
      times.length > 0
        ? new Date(Math.max(...times)).toISOString()
        : null;
    const newest = lastHeartbeatAt ? new Date(lastHeartbeatAt).getTime() : 0;
    const ageMin = (Date.now() - newest) / 60000;
    if (ageMin <= 15) heartbeatStatus = "healthy";
    else if (ageMin <= 60) heartbeatStatus = "degraded";
    else heartbeatStatus = "silent";
  }

  const aiRows = aiUsage.data ?? [];
  const aiTokens = aiRows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);

  const errorBuckets = emptyBuckets(14);
  for (const row of errors.data ?? []) {
    const key = dayLabel(row.occurred_at);
    if (errorBuckets.has(key)) {
      errorBuckets.set(key, (errorBuckets.get(key) ?? 0) + 1);
    }
  }
  const incidentBuckets = emptyBuckets(14);
  for (const row of incidents.data ?? []) {
    const key = dayLabel(row.detected_at);
    if (incidentBuckets.has(key)) {
      incidentBuckets.set(key, (incidentBuckets.get(key) ?? 0) + 1);
    }
  }

  const apiBuckets = emptyBuckets(14);
  const keyIds = (apiKeys.data ?? []).map((row) => row.id);
  if (keyIds.length > 0) {
    const { data: logs, error: logError } = await admin
      .from("api_key_logs")
      .select("created_at")
      .in("api_key_id", keyIds.slice(0, 200))
      .gte("created_at", since14d)
      .limit(10000);
    if (logError) throw mapPostgrestError(logError);
    for (const row of logs ?? []) {
      const key = dayLabel(row.created_at);
      if (apiBuckets.has(key)) {
        apiBuckets.set(key, (apiBuckets.get(key) ?? 0) + 1);
      }
    }
  }

  const aiBuckets = emptyBuckets(14);
  for (const row of aiRows) {
    const key = dayLabel(row.created_at);
    if (aiBuckets.has(key)) {
      aiBuckets.set(key, (aiBuckets.get(key) ?? 0) + (row.total_tokens ?? 0));
    }
  }

  const memberBuckets = emptyBuckets(14);
  for (const row of memberRows.data ?? []) {
    const key = dayLabel(row.created_at);
    if (memberBuckets.has(key)) {
      // cumulative later
      memberBuckets.set(key, (memberBuckets.get(key) ?? 0) + 1);
    }
  }
  const projectBuckets = emptyBuckets(14);
  for (const row of projectRows.data ?? []) {
    const key = dayLabel(row.created_at);
    if (projectBuckets.has(key)) {
      projectBuckets.set(key, (projectBuckets.get(key) ?? 0) + 1);
    }
  }

  let runningMembers = 0;
  let runningProjects = 0;
  const analytics: WorkspaceAnalyticsPoint[] = [...errorBuckets.keys()].map(
    (label) => {
      runningMembers += memberBuckets.get(label) ?? 0;
      runningProjects += projectBuckets.get(label) ?? 0;
      return {
        label,
        projects: runningProjects,
        apiRequests: apiBuckets.get(label) ?? 0,
        errors: errorBuckets.get(label) ?? 0,
        aiTokens: aiBuckets.get(label) ?? 0,
        members: runningMembers,
        growth: (memberBuckets.get(label) ?? 0) + (projectBuckets.get(label) ?? 0),
      };
    },
  );

  // Fix cumulative: members/projects created before window
  const membersBefore = (memberRows.data ?? []).filter(
    (row) => row.created_at < since14d,
  ).length;
  const projectsBefore = (projectRows.data ?? []).filter(
    (row) => row.created_at < since14d,
  ).length;
  let mem = membersBefore;
  let proj = projectsBefore;
  for (const point of analytics) {
    mem += memberBuckets.get(point.label) ?? 0;
    proj += projectBuckets.get(point.label) ?? 0;
    point.members = mem;
    point.projects = proj;
  }

  const healthScore = computeHealthScore({
    errorCount30d: listItem.errorCount30d,
    incidentCount30d: listItem.incidentCount30d,
    projectCount: listItem.projectCount,
    heartbeatStatus,
  });

  const activity = [
    ...(auditProduct.data ?? []).map((row) => ({
      id: row.id,
      title: row.action,
      detail: row.summary,
      occurredAt: row.created_at,
    })),
    ...adminAudit.map((row) => ({
      id: row.id,
      title: row.action,
      detail: row.summary,
      occurredAt: row.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, 50);

  return {
    workspace: listItem,
    timezone: workspace.timezone,
    notificationDefaults: workspace.notification_defaults,
    securityPolicies: workspace.security_policies,
    healthScore,
    heartbeatStatus,
    lastHeartbeatAt,
    aiUsage: { requests: aiRows.length, tokens: aiTokens },
    notificationCount30d: notifications.count ?? 0,
    members: (memberRows.data ?? []).map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        email: profile?.email ?? "—",
        fullName: profile?.fullName ?? null,
        role: row.role,
        status: row.status,
        joinedAt: row.created_at,
      };
    }),
    invitations: (invitationRows.data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      acceptedAt: row.accepted_at,
    })),
    projects: (projectRows.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.created_at,
    })),
    apiKeys: (apiKeys.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      status: row.status,
      environment: row.environment,
      projectId: row.project_id,
      lastUsedAt: row.last_used_at,
    })),
    recentErrors: (errors.data ?? []).slice(0, 20).map((row) => ({
      id: row.id,
      message: row.message ?? "—",
      level: row.level,
      occurredAt: row.occurred_at,
    })),
    recentIncidents: (incidents.data ?? []).slice(0, 20).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      severity: row.severity,
      detectedAt: row.detected_at,
    })),
    activity,
    auditLogs: adminAudit.map((row) => ({
      id: row.id,
      action: row.action,
      summary: row.summary,
      actorId: row.actorId,
      createdAt: row.createdAt,
    })),
    analytics,
    errorTrend: [...errorBuckets.entries()].map(([label, value]) => ({
      label,
      value,
    })),
    incidentTrend: [...incidentBuckets.entries()].map(([label, value]) => ({
      label,
      value,
    })),
    apiRequestTrend: [...apiBuckets.entries()].map(([label, value]) => ({
      label,
      value,
    })),
  };
}
