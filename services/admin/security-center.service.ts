import "server-only";

import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { clamp, round } from "@/services/health/math";
import {
  permissionsForAdminRole,
  assertAdminPermission,
} from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  ActiveSessionRow,
  AuditTimelineItem,
  LoginSessionRow,
  RiskAnalysis,
  SecurityAlertItem,
  SecurityCenterData,
  SecurityCenterFilters,
  SecurityEventType,
  SecurityOverviewKpis,
  SecurityRange,
  SecuritySeverity,
  ThreatItem,
} from "@/services/admin/security-center.types";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { AdminAuditAction } from "@/types/database";

function rangeToMs(range: SecurityRange): number {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function resolveWindow(filters: SecurityCenterFilters): {
  since: string;
  until: string;
  range: SecurityRange;
} {
  const until = filters.to?.trim()
    ? new Date(filters.to).toISOString()
    : new Date().toISOString();
  if (filters.from?.trim()) {
    return {
      since: new Date(filters.from).toISOString(),
      until,
      range: filters.range ?? "24h",
    };
  }
  const range = filters.range ?? "24h";
  return {
    since: new Date(Date.now() - rangeToMs(range)).toISOString(),
    until,
    range,
  };
}

function dayLabels(since: string, until: string): string[] {
  const labels: string[] = [];
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(until);
  while (cursor <= end) {
    labels.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return labels.length ? labels : [new Date(since).toISOString().slice(0, 10)];
}

function severityFromScore(score: number): SecuritySeverity {
  if (score < 50) return "critical";
  if (score < 70) return "high";
  if (score < 85) return "medium";
  return "low";
}

function adminActionSeverity(action: AdminAuditAction): SecuritySeverity {
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
    case "auth_oauth_linked":
      return "medium";
    default:
      return "low";
  }
}

function computeSecurityScore(input: {
  failedApiAuth: number;
  suspendedUsers: number;
  openCriticalIncidents: number;
  abuseIps: number;
  activeSessions: number;
  revokedKeysRecent: number;
}): number {
  let score = 100;
  score -= Math.min(35, input.failedApiAuth * 2);
  score -= Math.min(20, input.suspendedUsers * 3);
  score -= Math.min(25, input.openCriticalIncidents * 12);
  score -= Math.min(15, input.abuseIps * 5);
  score -= Math.min(10, input.revokedKeysRecent);
  if (input.activeSessions > 500) score -= 5;
  return clamp(round(score), 0, 100);
}

function buildRecommendations(input: {
  failedApiAuth: number;
  suspendedUsers: number;
  openCriticalIncidents: number;
  abuseIps: number;
  flaggedSessions: number;
  productLoginNote: boolean;
}): string[] {
  const tips: string[] = [];
  if (input.failedApiAuth > 0) {
    tips.push(
      `${input.failedApiAuth} API key authentication failures detected in range — rotate compromised keys and review project SDK configs.`,
    );
  }
  if (input.abuseIps > 0) {
    tips.push(
      `${input.abuseIps} IP address(es) show repeated API auth failures — investigate for credential stuffing or leaked keys.`,
    );
  }
  if (input.openCriticalIncidents > 0) {
    tips.push(
      `${input.openCriticalIncidents} open critical incident(s) remain — prioritize resolution in Monitoring Mission Control.`,
    );
  }
  if (input.suspendedUsers > 0) {
    tips.push(
      `${input.suspendedUsers} suspended (banned) user account(s) — confirm suspensions are intentional and ownership is transferred where needed.`,
    );
  }
  if (input.flaggedSessions > 0) {
    tips.push(
      `${input.flaggedSessions} session(s) flagged for new browser, IP, or country — review Active Sessions and revoke unknown devices.`,
    );
  }
  tips.push(
    "Product password-login failures are not mirrored into app tables (Supabase Auth). Enable Auth logs externally if you need that signal.",
  );
  tips.push(
    "Rate-limit / blocked-request history is not persisted — current enforcement is in-process only.",
  );
  if (tips.length <= 2) {
    tips.unshift(
      "No elevated API auth failure volume in the selected window — continue monitoring key rotation hygiene.",
    );
  }
  return tips;
}

export async function getSecurityCenter(
  role: AdminPlatformRole,
  filters: SecurityCenterFilters = {},
): Promise<SecurityCenterData> {
  assertAdminPermission(role, "admin:security:read");
  const admin = createSupabaseAdminClient();
  const { since, until, range } = resolveWindow(filters);
  const labels = dayLabels(since, until);

  let projectIdsForWorkspace: string[] | null = null;
  if (filters.workspaceId) {
    const { data, error } = await admin
      .from("projects")
      .select("id")
      .eq("workspace_id", filters.workspaceId);
    if (error) throw mapPostgrestError(error);
    projectIdsForWorkspace = (data ?? []).map((row) => row.id);
  }

  const [
    workspacesRes,
    projectsRes,
    profilesBanned,
    adminUsersRes,
    sessionsActive,
    sessionsRecent,
    sessionsHistory,
    keyFailRes,
    keySuccessRes,
    keyUsedRes,
    keysRes,
    auditRes,
    incidentsRes,
    loginEventsRes,
  ] = await Promise.all([
    admin.from("workspaces").select("id, name").order("name").limit(500),
    admin.from("projects").select("id, name, workspace_id").limit(1000),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "banned"),
    admin.from("admin_users").select("id, user_id, role, last_login, created_at"),
    admin
      .from("user_sessions")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null),
    admin
      .from("user_sessions")
      .select(
        "id, user_id, device_label, browser, os, country, ip_address, last_active_at, created_at, is_current, revoked_at",
      )
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("user_sessions")
      .select("user_id, browser, country, ip_address, created_at")
      .lt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    (() => {
      let q = admin
        .from("api_key_logs")
        .select("id, api_key_id, project_id, user_id, event, ip_address, created_at, metadata")
        .eq("event", "auth_failed")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (projectIdsForWorkspace) {
        if (projectIdsForWorkspace.length === 0) {
          return Promise.resolve({ data: [], error: null });
        }
        q = q.in("project_id", projectIdsForWorkspace);
      }
      return q;
    })(),
    (() => {
      let q = admin
        .from("api_key_logs")
        .select("id", { count: "exact", head: true })
        .eq("event", "auth_success")
        .gte("created_at", since)
        .lte("created_at", until);
      if (projectIdsForWorkspace) {
        if (projectIdsForWorkspace.length === 0) {
          return Promise.resolve({ count: 0, error: null });
        }
        q = q.in("project_id", projectIdsForWorkspace);
      }
      return q;
    })(),
    (() => {
      let q = admin
        .from("api_key_logs")
        .select("id, api_key_id, project_id, created_at")
        .in("event", ["used", "auth_success"])
        .gte("created_at", since)
        .lte("created_at", until)
        .limit(5000);
      if (projectIdsForWorkspace) {
        if (projectIdsForWorkspace.length === 0) {
          return Promise.resolve({ data: [], error: null });
        }
        q = q.in("project_id", projectIdsForWorkspace);
      }
      return q;
    })(),
    admin
      .from("api_keys")
      .select("id, name, key_prefix, project_id, status, revoked_at, last_used_at")
      .limit(2000),
    admin
      .from("admin_audit_logs")
      .select(
        "id, actor_id, action, target_user_id, target_workspace_id, summary, metadata, ip_address, created_at",
      )
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("incidents")
      .select(
        "id, title, status, severity, project_id, detected_at, resolved_at",
      )
      .gte("detected_at", since)
      .lte("detected_at", until)
      .order("detected_at", { ascending: false })
      .limit(200),
    admin
      .from("auth_login_events")
      .select(
        "id, user_id, email, method, result, provider, device_label, browser, os, country, ip_address, is_suspicious, suspicion_reasons, created_at",
      )
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  for (const result of [
    workspacesRes,
    projectsRes,
    adminUsersRes,
    sessionsRecent,
    sessionsHistory,
    keyFailRes,
    keyUsedRes,
    keysRes,
    auditRes,
    incidentsRes,
    loginEventsRes,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }
  if (profilesBanned.error) throw mapPostgrestError(profilesBanned.error);
  if (sessionsActive.error) throw mapPostgrestError(sessionsActive.error);
  if (keySuccessRes.error) throw mapPostgrestError(keySuccessRes.error);

  const workspaceMap = new Map(
    (workspacesRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const projectMap = new Map(
    (projectsRes.data ?? []).map((row) => [
      row.id,
      {
        name: row.name,
        workspaceId: row.workspace_id,
        workspaceName: workspaceMap.get(row.workspace_id) ?? "Workspace",
      },
    ]),
  );

  const userIds = new Set<string>();
  for (const row of sessionsRecent.data ?? []) userIds.add(row.user_id);
  for (const row of adminUsersRes.data ?? []) userIds.add(row.user_id);
  for (const row of keyFailRes.data ?? []) {
    if (row.user_id) userIds.add(row.user_id);
  }
  for (const row of auditRes.data ?? []) {
    if (row.actor_id) userIds.add(row.actor_id);
    if (row.target_user_id) userIds.add(row.target_user_id);
  }
  for (const row of loginEventsRes.data ?? []) {
    if (row.user_id) userIds.add(row.user_id);
  }

  const activeSessionsRes = await admin
    .from("user_sessions")
    .select(
      "id, user_id, device_label, browser, os, country, ip_address, last_active_at, is_current, revoked_at",
    )
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false })
    .limit(200);
  if (activeSessionsRes.error) throw mapPostgrestError(activeSessionsRes.error);
  for (const row of activeSessionsRes.data ?? []) userIds.add(row.user_id);

  const profilesRes =
    userIds.size > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name, status")
          .in("id", [...userIds].slice(0, 1000))
      : { data: [], error: null };
  if (profilesRes.error) throw mapPostgrestError(profilesRes.error);
  const profileMap = new Map(
    (profilesRes.data ?? []).map((row) => [
      row.id,
      { email: row.email, fullName: row.full_name, status: row.status },
    ]),
  );

  // Historical fingerprints per user for "new" detection
  const knownBrowsers = new Map<string, Set<string>>();
  const knownCountries = new Map<string, Set<string>>();
  const knownIps = new Map<string, Set<string>>();
  for (const row of sessionsHistory.data ?? []) {
    if (row.browser) {
      const set = knownBrowsers.get(row.user_id) ?? new Set();
      set.add(row.browser);
      knownBrowsers.set(row.user_id, set);
    }
    if (row.country) {
      const set = knownCountries.get(row.user_id) ?? new Set();
      set.add(row.country.toUpperCase());
      knownCountries.set(row.user_id, set);
    }
    if (row.ip_address) {
      const set = knownIps.get(row.user_id) ?? new Set();
      set.add(row.ip_address);
      knownIps.set(row.user_id, set);
    }
  }

  const mapSession = (row: {
    id: string;
    user_id: string;
    device_label: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    ip_address: string | null;
    last_active_at: string;
    created_at: string;
    is_current: boolean;
    revoked_at: string | null;
  }): LoginSessionRow => {
    const profile = profileMap.get(row.user_id);
    const flags: LoginSessionRow["flags"] = [];
    if (!row.device_label && !row.browser) flags.push("unknown_device");
    if (
      row.country &&
      !(knownCountries.get(row.user_id)?.has(row.country.toUpperCase()) ?? false)
    ) {
      flags.push("unknown_country");
    }
    if (
      row.browser &&
      !(knownBrowsers.get(row.user_id)?.has(row.browser) ?? false)
    ) {
      flags.push("new_browser");
    }
    if (
      row.ip_address &&
      !(knownIps.get(row.user_id)?.has(row.ip_address) ?? false)
    ) {
      flags.push("new_ip");
    }
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: profile?.email ?? "—",
      userName: profile?.fullName ?? null,
      browser: row.browser,
      os: row.os,
      deviceLabel: row.device_label,
      country: row.country,
      ipAddress: row.ip_address,
      lastActiveAt: row.last_active_at,
      createdAt: row.created_at,
      isCurrent: row.is_current,
      revokedAt: row.revoked_at,
      flags,
    };
  };

  const mapLoginEvent = (row: {
    id: string;
    user_id: string | null;
    email: string | null;
    method: string;
    result: string;
    provider: string | null;
    device_label: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    ip_address: string | null;
    is_suspicious: boolean;
    suspicion_reasons: string[] | null;
    created_at: string;
  }): LoginSessionRow | null => {
    if (!row.user_id) return null;
    const profile = profileMap.get(row.user_id);
    const reasons = new Set(row.suspicion_reasons ?? []);
    const flags: LoginSessionRow["flags"] = [];
    if (reasons.has("unknown_country") || reasons.has("new_country")) {
      flags.push("unknown_country");
    }
    if (reasons.has("new_browser")) flags.push("new_browser");
    if (reasons.has("new_ip")) flags.push("new_ip");
    if (!row.device_label && !row.browser) flags.push("unknown_device");
    if (row.is_suspicious && flags.length === 0) flags.push("unknown_device");
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: profile?.email ?? row.email ?? "—",
      userName: profile?.fullName ?? null,
      browser: row.browser ?? row.method,
      os: row.os ?? row.provider,
      deviceLabel: row.device_label ?? `${row.method}${row.provider ? ` · ${row.provider}` : ""}`,
      country: row.country,
      ipAddress: row.ip_address,
      lastActiveAt: row.created_at,
      createdAt: row.created_at,
      isCurrent: false,
      revokedAt: null,
      flags,
    };
  };

  const authLoginRows = (loginEventsRes.data ?? [])
    .map(mapLoginEvent)
    .filter((row): row is LoginSessionRow => row !== null);

  let recentLogins =
    authLoginRows.length > 0
      ? authLoginRows
      : (sessionsRecent.data ?? []).map(mapSession);
  const flaggedSessions = recentLogins.filter(
    (row) =>
      row.flags.length > 0 ||
      (loginEventsRes.data ?? []).some(
        (event) => event.id === row.id && event.is_suspicious,
      ),
  );

  // Surface suspicious auth logins in threat timeline via audit already; bump alerts below.

  // Abuse by IP
  const failByIp = new Map<string, { failures: number; lastSeen: string }>();
  for (const row of keyFailRes.data ?? []) {
    const ip = row.ip_address ?? "unknown";
    const prev = failByIp.get(ip);
    if (!prev) {
      failByIp.set(ip, { failures: 1, lastSeen: row.created_at });
    } else {
      prev.failures += 1;
      if (row.created_at > prev.lastSeen) prev.lastSeen = row.created_at;
    }
  }
  const abuseAttempts = [...failByIp.entries()]
    .filter(([, stats]) => stats.failures >= 3)
    .map(([ip, stats]) => ({
      ipAddress: ip === "unknown" ? null : ip,
      failures: stats.failures,
      lastSeen: stats.lastSeen,
    }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 20);

  const revokedKeys = (keysRes.data ?? []).filter(
    (key) => key.status === "revoked",
  );
  const revokedKeysRecent = revokedKeys.filter(
    (key) => key.revoked_at && key.revoked_at >= since && key.revoked_at <= until,
  ).length;

  const useCount = new Map<string, number>();
  for (const row of keyUsedRes.data ?? []) {
    if (!row.api_key_id) continue;
    useCount.set(row.api_key_id, (useCount.get(row.api_key_id) ?? 0) + 1);
  }
  const keyMap = new Map((keysRes.data ?? []).map((key) => [key.id, key]));
  const mostUsed = [...useCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, count]) => {
      const key = keyMap.get(id);
      const project = key ? projectMap.get(key.project_id) : null;
      return {
        id,
        name: key?.name ?? "API key",
        keyPrefix: key?.key_prefix ?? "—",
        projectId: key?.project_id ?? "",
        projectName: project?.name ?? "Project",
        lastUsedAt: key?.last_used_at ?? null,
        useEvents: count,
      };
    });

  const openCriticalIncidents = (incidentsRes.data ?? []).filter(
    (inc) =>
      inc.severity === "critical" &&
      inc.status !== "resolved",
  ).length;

  const failedApiAuth = (keyFailRes.data ?? []).length;
  const securityScore = computeSecurityScore({
    failedApiAuth,
    suspendedUsers: profilesBanned.count ?? 0,
    openCriticalIncidents,
    abuseIps: abuseAttempts.length,
    activeSessions: sessionsActive.count ?? 0,
    revokedKeysRecent,
  });
  const riskLevel = severityFromScore(securityScore);

  // Audit / timeline
  const auditItems: AuditTimelineItem[] = [];

  for (const row of keyFailRes.data ?? []) {
    const project = row.project_id ? projectMap.get(row.project_id) : null;
    auditItems.push({
      id: `fail-${row.id}`,
      source: "api_key_log",
      eventType: "api_auth_failed",
      severity: "high",
      action: "auth_failed",
      summary: "API key authentication failed",
      actorId: row.user_id,
      actorEmail: row.user_id
        ? (profileMap.get(row.user_id)?.email ?? null)
        : null,
      targetUserId: row.user_id,
      targetUserEmail: row.user_id
        ? (profileMap.get(row.user_id)?.email ?? null)
        : null,
      workspaceId: project?.workspaceId ?? null,
      projectId: row.project_id,
      ipAddress: row.ip_address,
      occurredAt: row.created_at,
    });
  }

  for (const row of auditRes.data ?? []) {
    const severity = adminActionSeverity(row.action);
    let eventType: SecurityEventType = "admin_action";
    if (row.action === "user_suspended") eventType = "user_suspended";
    if (row.action === "user_force_logout") eventType = "session_revoked";
    auditItems.push({
      id: `admin-${row.id}`,
      source: "admin_audit",
      eventType,
      severity,
      action: row.action,
      summary: row.summary,
      actorId: row.actor_id,
      actorEmail: row.actor_id
        ? (profileMap.get(row.actor_id)?.email ?? null)
        : null,
      targetUserId: row.target_user_id,
      targetUserEmail: row.target_user_id
        ? (profileMap.get(row.target_user_id)?.email ?? null)
        : null,
      workspaceId: row.target_workspace_id,
      projectId: null,
      ipAddress: row.ip_address,
      occurredAt: row.created_at,
      adminAction: row.action,
    });
  }

  for (const row of recentLogins.slice(0, 80)) {
    auditItems.push({
      id: `sess-${row.id}`,
      source: "session",
      eventType: row.revokedAt ? "session_revoked" : "session_created",
      severity: row.flags.length > 0 ? "medium" : "low",
      action: row.revokedAt ? "session_revoked" : "session_created",
      summary: `${row.userEmail} · ${row.deviceLabel ?? row.browser ?? "session"}`,
      actorId: row.userId,
      actorEmail: row.userEmail,
      targetUserId: row.userId,
      targetUserEmail: row.userEmail,
      workspaceId: null,
      projectId: null,
      ipAddress: row.ipAddress,
      occurredAt: row.createdAt,
    });
  }

  for (const inc of incidentsRes.data ?? []) {
    if (filters.workspaceId) {
      const project = projectMap.get(inc.project_id);
      if (!project || project.workspaceId !== filters.workspaceId) continue;
    }
    const severity = inc.severity as SecuritySeverity;
    const project = projectMap.get(inc.project_id);
    auditItems.push({
      id: `inc-${inc.id}`,
      source: "incident",
      eventType: "incident",
      severity,
      action: inc.status,
      summary: inc.title,
      actorId: null,
      actorEmail: null,
      targetUserId: null,
      targetUserEmail: null,
      workspaceId: project?.workspaceId ?? null,
      projectId: inc.project_id,
      ipAddress: null,
      occurredAt: inc.detected_at,
    });
  }

  for (const key of revokedKeys) {
    if (!key.revoked_at || key.revoked_at < since || key.revoked_at > until) {
      continue;
    }
    if (
      filters.workspaceId &&
      projectMap.get(key.project_id)?.workspaceId !== filters.workspaceId
    ) {
      continue;
    }
    auditItems.push({
      id: `revkey-${key.id}`,
      source: "api_key_log",
      eventType: "api_key_revoked",
      severity: "medium",
      action: "revoked",
      summary: `API key revoked · ${key.name} (${key.key_prefix}…)`,
      actorId: null,
      actorEmail: null,
      targetUserId: null,
      targetUserEmail: null,
      workspaceId: projectMap.get(key.project_id)?.workspaceId ?? null,
      projectId: key.project_id,
      ipAddress: null,
      occurredAt: key.revoked_at,
    });
  }

  auditItems.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  // Filters: severity, event type, role, search
  let filteredAudit = auditItems;
  if (filters.severity) {
    filteredAudit = filteredAudit.filter(
      (item) => item.severity === filters.severity,
    );
  }
  if (filters.eventType) {
    filteredAudit = filteredAudit.filter(
      (item) => item.eventType === filters.eventType,
    );
  }
  if (filters.role) {
    const roleUserIds = new Set(
      (adminUsersRes.data ?? [])
        .filter((row) => row.role === filters.role)
        .map((row) => row.user_id),
    );
    filteredAudit = filteredAudit.filter(
      (item) =>
        (item.actorId && roleUserIds.has(item.actorId)) ||
        (item.targetUserId && roleUserIds.has(item.targetUserId)),
    );
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    const matchingProjects = new Set(
      [...projectMap.entries()]
        .filter(([, meta]) => meta.name.toLowerCase().includes(q))
        .map(([id]) => id),
    );
    const matchingWorkspaces = new Set(
      [...workspaceMap.entries()]
        .filter(([, name]) => name.toLowerCase().includes(q))
        .map(([id]) => id),
    );
    const matchingKeys = new Set(
      (keysRes.data ?? [])
        .filter(
          (key) =>
            key.name.toLowerCase().includes(q) ||
            key.key_prefix.toLowerCase().includes(q),
        )
        .map((key) => key.id),
    );
    filteredAudit = filteredAudit.filter((item) => {
      const hay = [
        item.summary,
        item.actorEmail,
        item.targetUserEmail,
        item.action,
        item.ipAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (hay.includes(q)) return true;
      if (item.projectId && matchingProjects.has(item.projectId)) return true;
      if (item.workspaceId && matchingWorkspaces.has(item.workspaceId)) {
        return true;
      }
      if (item.id.startsWith("revkey-") && matchingKeys.has(item.id.slice(7))) {
        return true;
      }
      return false;
    });

    recentLogins = recentLogins.filter(
      (row) =>
        row.userEmail.toLowerCase().includes(q) ||
        (row.userName ?? "").toLowerCase().includes(q) ||
        (row.ipAddress ?? "").toLowerCase().includes(q) ||
        (row.country ?? "").toLowerCase().includes(q),
    );
  }

  const threatsFromAudit = (severity: SecuritySeverity): ThreatItem[] =>
    filteredAudit
      .filter((item) => item.severity === severity)
      .slice(0, 40)
      .map((item) => ({
        id: item.id,
        severity: item.severity,
        title: item.summary,
        detail: item.action,
        source: item.source,
        occurredAt: item.occurredAt,
        userId: item.targetUserId ?? item.actorId,
        userEmail: item.targetUserEmail ?? item.actorEmail,
        workspaceId: item.workspaceId,
        workspaceName: item.workspaceId
          ? (workspaceMap.get(item.workspaceId) ?? null)
          : null,
        projectId: item.projectId,
        projectName: item.projectId
          ? (projectMap.get(item.projectId)?.name ?? null)
          : null,
      }));

  const threatTimeline = filteredAudit.slice(0, 60).map((item) => ({
    id: item.id,
    severity: item.severity,
    title: item.summary,
    detail: `${item.source} · ${item.action}`,
    source: item.source,
    occurredAt: item.occurredAt,
    userId: item.targetUserId ?? item.actorId,
    userEmail: item.targetUserEmail ?? item.actorEmail,
    workspaceId: item.workspaceId,
    workspaceName: item.workspaceId
      ? (workspaceMap.get(item.workspaceId) ?? null)
      : null,
    projectId: item.projectId,
    projectName: item.projectId
      ? (projectMap.get(item.projectId)?.name ?? null)
      : null,
  }));

  // Admin accounts
  let adminAccounts = (adminUsersRes.data ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    const recentActions = (auditRes.data ?? []).filter(
      (a) => a.actor_id === row.user_id,
    ).length;
    return {
      userId: row.user_id,
      email: profile?.email ?? "—",
      fullName: profile?.fullName ?? null,
      role: row.role,
      lastLogin: row.last_login,
      permissions: permissionsForAdminRole(row.role),
      recentActions,
    };
  });
  if (filters.role) {
    adminAccounts = adminAccounts.filter((a) => a.role === filters.role);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    adminAccounts = adminAccounts.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.fullName ?? "").toLowerCase().includes(q),
    );
  }

  const activeSessions: ActiveSessionRow[] = (activeSessionsRes.data ?? []).map(
    (row) => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        userEmail: profile?.email ?? "—",
        userName: profile?.fullName ?? null,
        browser: row.browser,
        os: row.os,
        deviceLabel: row.device_label,
        country: row.country,
        ipAddress: row.ip_address,
        lastActiveAt: row.last_active_at,
        isCurrent: row.is_current,
      };
    },
  );

  // Risk trend from daily failure + suspension signals
  const failByDay = new Map(labels.map((label) => [label, 0]));
  for (const row of keyFailRes.data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (failByDay.has(day)) {
      failByDay.set(day, (failByDay.get(day) ?? 0) + 1);
    }
  }
  const riskTrend = labels.map((label) => {
    const fails = failByDay.get(label) ?? 0;
    const dayScore = clamp(100 - fails * 4, 0, 100);
    return { label, score: dayScore };
  });

  const recommendations = buildRecommendations({
    failedApiAuth,
    suspendedUsers: profilesBanned.count ?? 0,
    openCriticalIncidents,
    abuseIps: abuseAttempts.length,
    flaggedSessions: flaggedSessions.length,
    productLoginNote: true,
  });

  const risk: RiskAnalysis = {
    overallScore: securityScore,
    riskLevel,
    trend: riskTrend,
    recommendations,
  };

  // Alerts derived (no dismissed store)
  const alerts: SecurityAlertItem[] = [];
  for (const abuse of abuseAttempts.slice(0, 10)) {
    alerts.push({
      id: `abuse-${abuse.ipAddress ?? "unknown"}`,
      title: `Repeated API auth failures${
        abuse.ipAddress ? ` from ${abuse.ipAddress}` : ""
      }`,
      severity: abuse.failures >= 10 ? "critical" : "high",
      source: "API key logs",
      status: "open",
      occurredAt: abuse.lastSeen,
    });
  }
  for (const inc of incidentsRes.data ?? []) {
    if (inc.severity !== "critical" && inc.severity !== "high") continue;
    alerts.push({
      id: `alert-inc-${inc.id}`,
      title: inc.title,
      severity: inc.severity,
      source: "Incidents",
      status:
        inc.status === "resolved"
          ? "resolved"
          : inc.status === "monitoring"
            ? "acknowledged"
            : "open",
      occurredAt: inc.detected_at,
    });
  }
  for (const item of (auditRes.data ?? [])
    .filter((row) => row.action === "user_suspended")
    .slice(0, 10)) {
    alerts.push({
      id: `alert-sus-${item.id}`,
      title: item.summary,
      severity: "high",
      source: "Admin audit",
      status: "acknowledged",
      occurredAt: item.created_at,
    });
  }
  for (const event of (loginEventsRes.data ?? [])
    .filter((row) => row.is_suspicious)
    .slice(0, 15)) {
    alerts.push({
      id: `alert-login-${event.id}`,
      title: `Suspicious login (${event.method})`,
      severity: "high",
      source: "Auth login events",
      status: "open",
      occurredAt: event.created_at,
    });
  }

  const successfulAuthLogins = (loginEventsRes.data ?? []).filter(
    (row) => row.result === "success" || row.result === "suspicious",
  ).length;
  const failedAuthLogins = (loginEventsRes.data ?? []).filter(
    (row) => row.result === "failure",
  ).length;

  const overview: SecurityOverviewKpis = {
    securityScore,
    riskLevel,
    failedApiAuth: failedApiAuth + failedAuthLogins,
    successfulSessions:
      successfulAuthLogins > 0 ? successfulAuthLogins : recentLogins.length,
    blockedRequests: null,
    suspendedUsers: profilesBanned.count ?? 0,
    adminAccounts: (adminUsersRes.data ?? []).length,
    apiKeyFailures: failedApiAuth,
    securityEvents: filteredAudit.length,
    activeSessions: sessionsActive.count ?? 0,
  };

  // Failed API auth for login panel
  const failedApiAuthItems = filteredAudit
    .filter((item) => item.eventType === "api_auth_failed")
    .slice(0, 40);

  return {
    generatedAt: new Date().toISOString(),
    filters: { ...filters, range },
    overview,
    threats: {
      critical: threatsFromAudit("critical"),
      high: threatsFromAudit("high"),
      medium: threatsFromAudit("medium"),
      low: threatsFromAudit("low"),
      timeline: threatTimeline,
    },
    loginSecurity: {
      recentLogins: recentLogins.slice(0, 40),
      failedApiAuth: failedApiAuthItems,
      flaggedSessions: flaggedSessions.slice(0, 40),
    },
    activeSessions: activeSessions.slice(0, 100),
    apiSecurity: {
      failedAuth: failedApiAuth,
      successfulAuth: keySuccessRes.count ?? 0,
      revokedKeys: revokedKeys.length,
      expiredKeys: null,
      mostUsed,
      abuseAttempts,
      recentFailures: (keyFailRes.data ?? []).slice(0, 30).map((row) => ({
        id: row.id,
        apiKeyId: row.api_key_id,
        projectId: row.project_id,
        projectName: row.project_id
          ? (projectMap.get(row.project_id)?.name ?? null)
          : null,
        userId: row.user_id,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
      })),
    },
    adminSecurity: {
      accounts: adminAccounts,
      recentActions: filteredAudit
        .filter((item) => item.source === "admin_audit")
        .slice(0, 40),
    },
    audit: filteredAudit.slice(0, 120),
    risk,
    alerts: alerts
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 40),
    filterOptions: {
      workspaces: (workspacesRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
      })),
    },
    unavailable: [
      "product_login_failures",
      "blocked_request_history",
      "api_key_expiry",
      "alert_dismiss_state",
      "cities",
    ],
  };
}
