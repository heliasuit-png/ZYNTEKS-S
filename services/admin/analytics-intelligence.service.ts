import "server-only";

import { MONITORING } from "@/lib/constants";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { avg, clamp, percentile, round } from "@/services/health/math";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AnalyticsFilters,
  AnalyticsIntelligenceData,
  AnalyticsRange,
  CountryPoint,
  NamedCount,
  SeriesPoint,
} from "@/services/admin/analytics-intelligence.types";
import { createSupabaseAdminClient } from "@/supabase/admin";

const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 22, y: 38 },
  CA: { x: 22, y: 28 },
  MX: { x: 20, y: 48 },
  BR: { x: 35, y: 68 },
  GB: { x: 48, y: 30 },
  FR: { x: 50, y: 34 },
  DE: { x: 52, y: 32 },
  TR: { x: 60, y: 38 },
  IN: { x: 70, y: 48 },
  CN: { x: 78, y: 40 },
  JP: { x: 86, y: 38 },
  AU: { x: 86, y: 72 },
  NL: { x: 50, y: 30 },
  ES: { x: 47, y: 38 },
  IT: { x: 53, y: 38 },
  SE: { x: 54, y: 22 },
  SG: { x: 78, y: 58 },
  AE: { x: 64, y: 44 },
  KR: { x: 84, y: 40 },
  ZA: { x: 56, y: 72 },
};

function rangeToMs(range: AnalyticsRange): number {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
  }
}

function resolveWindow(filters: AnalyticsFilters): {
  since: string;
  until: string;
  range: AnalyticsRange;
} {
  const until = filters.to?.trim()
    ? new Date(filters.to).toISOString()
    : new Date().toISOString();
  if (filters.from?.trim()) {
    return {
      since: new Date(filters.from).toISOString(),
      until,
      range: filters.range ?? "30d",
    };
  }
  const range = filters.range ?? "30d";
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

function countMap(items: string[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = item.trim() || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function distinctActive(
  rows: { user_id: string; last_active_at: string }[],
  sinceIso: string,
): number {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.last_active_at >= sinceIso) set.add(row.user_id);
  }
  return set.size;
}

async function resolveProjectScope(
  filters: AnalyticsFilters,
): Promise<string[] | null> {
  const admin = createSupabaseAdminClient();
  if (filters.projectId) return [filters.projectId];
  if (!filters.workspaceId) return null;
  const { data, error } = await admin
    .from("projects")
    .select("id")
    .eq("workspace_id", filters.workspaceId);
  if (error) throw mapPostgrestError(error);
  return (data ?? []).map((row) => row.id);
}

function classifyProjectHealth(input: {
  lastHeartbeatAt: string | null;
  openIncidents: number;
  errors: number;
  now: number;
}): number {
  const stale =
    !input.lastHeartbeatAt ||
    input.now - new Date(input.lastHeartbeatAt).getTime() >
      MONITORING.heartbeatTimeoutMs;
  let score = 100;
  if (stale) score -= 40;
  score -= Math.min(30, input.openIncidents * 12);
  score -= Math.min(25, Math.floor(input.errors / 2));
  return clamp(round(score), 0, 100);
}

export async function getAnalyticsIntelligence(
  role: AdminPlatformRole,
  filters: AnalyticsFilters = {},
): Promise<AnalyticsIntelligenceData> {
  assertAdminPermission(role, "admin:analytics:read");
  const admin = createSupabaseAdminClient();
  const { since, until, range } = resolveWindow(filters);
  const labels = dayLabels(since, until);
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const priorSince = new Date(
    new Date(since).getTime() - (new Date(until).getTime() - new Date(since).getTime()),
  ).toISOString();
  const projectIds = await resolveProjectScope(filters);

  const [
    workspacesRes,
    projectsRes,
    membersRes,
    profilesNew,
    profilesLang,
    sessionsRes,
    sessionsPrior,
    keyLogsRes,
    keysCreated,
    aiRes,
    heartbeatsRes,
    errorsRes,
    perfRes,
    incidentsRes,
  ] = await Promise.all([
    admin.from("workspaces").select("id, name, plan, created_at").limit(1000),
    admin
      .from("projects")
      .select("id, name, workspace_id, created_at")
      .limit(2000),
    admin.from("workspace_members").select("workspace_id, user_id").limit(10000),
    admin
      .from("profiles")
      .select("id, created_at, language")
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(5000),
    admin.from("profiles").select("id, language").limit(10000),
    admin
      .from("user_sessions")
      .select(
        "id, user_id, browser, os, country, device_label, last_active_at, created_at, revoked_at",
      )
      .gte("last_active_at", priorSince)
      .order("last_active_at", { ascending: false })
      .limit(15000),
    admin
      .from("user_sessions")
      .select("user_id, created_at")
      .lt("created_at", since)
      .order("created_at", { ascending: true })
      .limit(10000),
    (() => {
      let q = admin
        .from("api_key_logs")
        .select("id, event, project_id, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .limit(8000);
      if (projectIds) {
        if (projectIds.length === 0) return Promise.resolve({ data: [], error: null });
        q = q.in("project_id", projectIds);
      }
      return q;
    })(),
    admin
      .from("api_keys")
      .select("id, created_at, project_id")
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(5000),
    admin
      .from("ai_usage")
      .select("id, model, total_tokens, created_at, user_id")
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(8000),
    (() => {
      let q = admin
        .from("heartbeats")
        .select("id, project_id, release, environment, occurred_at")
        .gte("occurred_at", since)
        .lte("occurred_at", until)
        .limit(8000);
      if (projectIds) {
        if (projectIds.length === 0) return Promise.resolve({ data: [], error: null });
        q = q.in("project_id", projectIds);
      }
      if (filters.environment) q = q.eq("environment", filters.environment);
      return q;
    })(),
    (() => {
      let q = admin
        .from("errors")
        .select(
          "id, project_id, message, occurrences, last_seen, environment, release",
        )
        .gte("last_seen", since)
        .lte("last_seen", until)
        .order("occurrences", { ascending: false })
        .limit(2000);
      if (projectIds) {
        if (projectIds.length === 0) return Promise.resolve({ data: [], error: null });
        q = q.in("project_id", projectIds);
      }
      if (filters.environment) q = q.eq("environment", filters.environment);
      return q;
    })(),
    (() => {
      let q = admin
        .from("performance_logs")
        .select("id, project_id, url, ttfb, page_load, environment, occurred_at")
        .gte("occurred_at", since)
        .lte("occurred_at", until)
        .limit(8000);
      if (projectIds) {
        if (projectIds.length === 0) return Promise.resolve({ data: [], error: null });
        q = q.in("project_id", projectIds);
      }
      if (filters.environment) q = q.eq("environment", filters.environment);
      return q;
    })(),
    (() => {
      let q = admin
        .from("incidents")
        .select(
          "id, project_id, status, severity, detected_at, resolved_at, started_at",
        )
        .gte("detected_at", since)
        .lte("detected_at", until)
        .limit(2000);
      if (projectIds) {
        if (projectIds.length === 0) return Promise.resolve({ data: [], error: null });
        q = q.in("project_id", projectIds);
      }
      return q;
    })(),
  ]);

  for (const result of [
    workspacesRes,
    projectsRes,
    membersRes,
    profilesNew,
    profilesLang,
    sessionsRes,
    sessionsPrior,
    keyLogsRes,
    keysCreated,
    aiRes,
    heartbeatsRes,
    errorsRes,
    perfRes,
    incidentsRes,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  let workspaces = workspacesRes.data ?? [];
  let projects = projectsRes.data ?? [];
  if (filters.workspaceId) {
    workspaces = workspaces.filter((w) => w.id === filters.workspaceId);
    projects = projects.filter((p) => p.workspace_id === filters.workspaceId);
  }
  if (filters.projectId) {
    projects = projects.filter((p) => p.id === filters.projectId);
  }

  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));
  const projectMap = new Map(
    projects.map((p) => [
      p.id,
      {
        name: p.name,
        workspaceId: p.workspace_id,
        workspaceName: workspaceMap.get(p.workspace_id)?.name ?? "Workspace",
      },
    ]),
  );

  let sessions = sessionsRes.data ?? [];
  if (filters.country?.trim()) {
    const country = filters.country.trim().toLowerCase();
    sessions = sessions.filter((s) =>
      (s.country ?? "").toLowerCase().includes(country),
    );
  }

  const sessionsInWindow = sessions.filter(
    (s) => s.last_active_at >= since && s.last_active_at <= until,
  );
  const sessionsCreatedInWindow = sessions.filter(
    (s) => s.created_at >= since && s.created_at <= until,
  );

  const dau = distinctActive(sessions, dayAgo);
  const wau = distinctActive(sessions, weekAgo);
  const mau = distinctActive(sessions, monthAgo);
  const newUsers = (profilesNew.data ?? []).length;

  const priorActives = new Set(
    sessions
      .filter(
        (s) => s.last_active_at >= priorSince && s.last_active_at < since,
      )
      .map((s) => s.user_id),
  );
  const currentActives = new Set(
    sessionsInWindow.map((s) => s.user_id),
  );
  let returned = 0;
  for (const userId of priorActives) {
    if (currentActives.has(userId)) returned += 1;
  }
  const retentionProxyPercent =
    priorActives.size === 0
      ? null
      : Math.round((returned / priorActives.size) * 1000) / 10;
  const churnProxyPercent =
    priorActives.size === 0
      ? null
      : Math.round(
          ((priorActives.size - returned) / priorActives.size) * 1000,
        ) / 10;

  const workspaceGrowth = workspaces.filter(
    (w) => w.created_at >= since && w.created_at <= until,
  ).length;
  const projectGrowth = projects.filter(
    (p) => p.created_at >= since && p.created_at <= until,
  ).length;
  const apiGrowth = (keysCreated.data ?? []).filter((key) => {
    if (!projectIds) return true;
    return projectIds.includes(key.project_id);
  }).length;

  const aiRows = aiRes.data ?? [];
  const aiTokens = aiRows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);

  const hbRows = heartbeatsRes.data ?? [];
  const projectsWithSdk = new Set(hbRows.map((row) => row.project_id));
  const sdkAdoptionPercent =
    projects.length === 0
      ? null
      : Math.round((projectsWithSdk.size / projects.length) * 1000) / 10;

  // Series
  const empty = () => new Map(labels.map((label) => [label, 0]));
  const activeByDay = empty();
  const newByDay = empty();
  const wsByDay = empty();
  const projByDay = empty();
  const apiByDay = empty();
  const aiByDay = empty();
  const errByDay = empty();
  const hbByDay = empty();

  const activeUsersByDay = new Map<string, Set<string>>();
  for (const label of labels) activeUsersByDay.set(label, new Set());
  for (const row of sessionsInWindow) {
    const day = row.last_active_at.slice(0, 10);
    activeUsersByDay.get(day)?.add(row.user_id);
  }
  for (const [day, set] of activeUsersByDay) {
    activeByDay.set(day, set.size);
  }
  for (const row of profilesNew.data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (newByDay.has(day)) newByDay.set(day, (newByDay.get(day) ?? 0) + 1);
  }
  for (const row of workspaces) {
    if (row.created_at < since || row.created_at > until) continue;
    const day = row.created_at.slice(0, 10);
    if (wsByDay.has(day)) wsByDay.set(day, (wsByDay.get(day) ?? 0) + 1);
  }
  for (const row of projects) {
    if (row.created_at < since || row.created_at > until) continue;
    const day = row.created_at.slice(0, 10);
    if (projByDay.has(day)) projByDay.set(day, (projByDay.get(day) ?? 0) + 1);
  }
  for (const row of keyLogsRes.data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (apiByDay.has(day)) apiByDay.set(day, (apiByDay.get(day) ?? 0) + 1);
  }
  for (const row of aiRows) {
    const day = row.created_at.slice(0, 10);
    if (aiByDay.has(day)) aiByDay.set(day, (aiByDay.get(day) ?? 0) + 1);
  }
  for (const row of errorsRes.data ?? []) {
    const day = row.last_seen.slice(0, 10);
    if (errByDay.has(day)) {
      errByDay.set(day, (errByDay.get(day) ?? 0) + (row.occurrences ?? 1));
    }
  }
  for (const row of hbRows) {
    const day = row.occurred_at.slice(0, 10);
    if (hbByDay.has(day)) hbByDay.set(day, (hbByDay.get(day) ?? 0) + 1);
  }

  const series: SeriesPoint[] = labels.map((label) => ({
    label,
    activeUsers: activeByDay.get(label) ?? 0,
    newUsers: newByDay.get(label) ?? 0,
    workspaces: wsByDay.get(label) ?? 0,
    projects: projByDay.get(label) ?? 0,
    apiEvents: apiByDay.get(label) ?? 0,
    aiRequests: aiByDay.get(label) ?? 0,
    errors: errByDay.get(label) ?? 0,
    heartbeats: hbByDay.get(label) ?? 0,
  }));

  // User analytics
  const firstSeen = new Map<string, string>();
  for (const row of sessionsPrior.data ?? []) {
    if (!firstSeen.has(row.user_id)) firstSeen.set(row.user_id, row.created_at);
  }
  let newSessions = 0;
  let returningSessions = 0;
  for (const row of sessionsCreatedInWindow) {
    const prior = firstSeen.get(row.user_id);
    if (!prior || prior >= since) newSessions += 1;
    else returningSessions += 1;
  }

  const usersBlock = {
    countries: countMap(
      sessionsInWindow.map((s) => s.country ?? "Unknown"),
    ).slice(0, 20),
    browsers: countMap(
      sessionsInWindow.map((s) => s.browser ?? "Unknown"),
    ).slice(0, 15),
    operatingSystems: countMap(
      sessionsInWindow.map((s) => s.os ?? "Unknown"),
    ).slice(0, 15),
    languages: countMap(
      (profilesLang.data ?? []).map((p) => p.language || "Unknown"),
    ).slice(0, 15),
    devices: countMap(
      sessionsInWindow.map((s) => s.device_label ?? "Unknown"),
    ).slice(0, 15),
    newSessions,
    returningSessions,
    averageSessionDurationMs: null as number | null,
    sessionDurationNote:
      "Session dwell duration is not stored. Values would be invented from long-lived session rows.",
  };

  // Workspace analytics + health
  const membersByWs = new Map<string, number>();
  for (const row of membersRes.data ?? []) {
    membersByWs.set(
      row.workspace_id,
      (membersByWs.get(row.workspace_id) ?? 0) + 1,
    );
  }
  const projectsByWs = new Map<string, string[]>();
  for (const row of projects) {
    const list = projectsByWs.get(row.workspace_id) ?? [];
    list.push(row.id);
    projectsByWs.set(row.workspace_id, list);
  }
  const apiByProject = new Map<string, number>();
  for (const row of keyLogsRes.data ?? []) {
    if (!row.project_id) continue;
    if (row.event !== "used" && row.event !== "auth_success") continue;
    apiByProject.set(
      row.project_id,
      (apiByProject.get(row.project_id) ?? 0) + 1,
    );
  }
  const lastHb = new Map<string, string>();
  for (const row of hbRows) {
    const prev = lastHb.get(row.project_id);
    if (!prev || row.occurred_at > prev) lastHb.set(row.project_id, row.occurred_at);
  }
  const openIncByProject = new Map<string, number>();
  for (const inc of incidentsRes.data ?? []) {
    if (inc.status === "resolved") continue;
    openIncByProject.set(
      inc.project_id,
      (openIncByProject.get(inc.project_id) ?? 0) + 1,
    );
  }
  const errByProject = new Map<string, number>();
  for (const err of errorsRes.data ?? []) {
    errByProject.set(
      err.project_id,
      (errByProject.get(err.project_id) ?? 0) + (err.occurrences ?? 1),
    );
  }

  const workspaceRows = workspaces.map((ws) => {
    const pids = projectsByWs.get(ws.id) ?? [];
    let apiEvents = 0;
    const scores: number[] = [];
    for (const pid of pids) {
      apiEvents += apiByProject.get(pid) ?? 0;
      scores.push(
        classifyProjectHealth({
          lastHeartbeatAt: lastHb.get(pid) ?? null,
          openIncidents: openIncByProject.get(pid) ?? 0,
          errors: errByProject.get(pid) ?? 0,
          now,
        }),
      );
    }
    return {
      id: ws.id,
      name: ws.name,
      plan: ws.plan,
      projects: pids.length,
      members: membersByWs.get(ws.id) ?? 0,
      apiEvents,
      healthScore: scores.length ? round(avg(scores) ?? 0) : null,
    };
  });

  const healthScores = workspaceRows
    .map((row) => row.healthScore)
    .filter((v): v is number => v != null);

  // API analytics
  const keyLogs = keyLogsRes.data ?? [];
  const successEvents = keyLogs.filter(
    (row) => row.event === "used" || row.event === "auth_success",
  ).length;
  const failureEvents = keyLogs.filter(
    (row) => row.event === "auth_failed",
  ).length;
  const requests = keyLogs.length;
  const successRate =
    requests === 0
      ? null
      : Math.round((successEvents / requests) * 1000) / 10;
  const errorRate =
    requests === 0
      ? null
      : Math.round((failureEvents / requests) * 1000) / 10;

  const latencies = (perfRes.data ?? [])
    .map((row) => row.ttfb ?? row.page_load)
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);

  const endpointMap = new Map<string, number[]>();
  const envCounts = new Map<string, number>();
  for (const row of perfRes.data ?? []) {
    const url = row.url?.trim() || "(unknown)";
    const latency = row.ttfb ?? row.page_load;
    if (latency != null) {
      const list = endpointMap.get(url) ?? [];
      list.push(latency);
      endpointMap.set(url, list);
    }
    envCounts.set(
      row.environment,
      (envCounts.get(row.environment) ?? 0) + 1,
    );
  }
  for (const row of hbRows) {
    envCounts.set(
      row.environment,
      (envCounts.get(row.environment) ?? 0) + 1,
    );
  }

  const topEndpoints = [...endpointMap.entries()]
    .map(([url, samples]) => {
      const sorted = [...samples].sort((a, b) => a - b);
      return {
        url,
        samples: sorted.length,
        avgMs: avg(sorted),
        p95Ms: percentile(sorted, 95),
      };
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 15);

  const slowEndpoints = [...topEndpoints]
    .sort((a, b) => (b.p95Ms ?? 0) - (a.p95Ms ?? 0))
    .slice(0, 10)
    .map((row) => ({
      url: row.url,
      samples: row.samples,
      p95Ms: row.p95Ms,
    }));

  // AI
  const modelMap = new Map<string, { requests: number; tokens: number }>();
  const aiTrend = new Map(
    labels.map((label) => [label, { requests: 0, tokens: 0 }]),
  );
  for (const row of aiRows) {
    const prev = modelMap.get(row.model) ?? { requests: 0, tokens: 0 };
    prev.requests += 1;
    prev.tokens += row.total_tokens ?? 0;
    modelMap.set(row.model, prev);
    const day = row.created_at.slice(0, 10);
    const bucket = aiTrend.get(day);
    if (bucket) {
      bucket.requests += 1;
      bucket.tokens += row.total_tokens ?? 0;
    }
  }

  // SDK
  const versionMap = new Map<
    string,
    {
      release: string;
      environment: string;
      heartbeats: number;
      errors: number;
      lastSeen: string;
    }
  >();
  for (const row of hbRows) {
    const release = row.release?.trim() || "unknown";
    const key = `${release}::${row.environment}`;
    const prev = versionMap.get(key);
    if (!prev) {
      versionMap.set(key, {
        release,
        environment: row.environment,
        heartbeats: 1,
        errors: 0,
        lastSeen: row.occurred_at,
      });
    } else {
      prev.heartbeats += 1;
      if (row.occurred_at > prev.lastSeen) prev.lastSeen = row.occurred_at;
    }
  }
  for (const err of errorsRes.data ?? []) {
    const release = err.release?.trim() || "unknown";
    const key = `${release}::${err.environment}`;
    const prev = versionMap.get(key);
    if (prev) prev.errors += err.occurrences ?? 1;
    else {
      versionMap.set(key, {
        release,
        environment: err.environment,
        heartbeats: 0,
        errors: err.occurrences ?? 1,
        lastSeen: err.last_seen,
      });
    }
  }

  // Errors
  const resolvedIncidents = (incidentsRes.data ?? []).filter(
    (inc) => inc.resolved_at,
  );
  const resolutionSeconds = resolvedIncidents
    .map((inc) => {
      const start = new Date(inc.detected_at).getTime();
      const end = new Date(inc.resolved_at!).getTime();
      return (end - start) / 1000;
    })
    .filter((v) => Number.isFinite(v) && v >= 0);
  const affectedProjects = new Set(
    (errorsRes.data ?? []).map((err) => err.project_id),
  );
  const affectedWorkspaces = new Set(
    [...affectedProjects]
      .map((pid) => projectMap.get(pid)?.workspaceId)
      .filter(Boolean) as string[],
  );

  // Geography: sessions + attach error/heartbeat counts by joining project owners' countries is weak.
  // Use session countries for traffic; errors/heartbeats stay country-unknown unless we attribute via session country of project owners — skip inventing.
  // Honest: errors/heartbeats on map = 0 unless we have country on those tables. Show sessions as traffic; errors/heartbeats as 0 with note OR distribute only session traffic.
  const countrySessions = new Map<
    string,
    { sessions: number; users: Set<string> }
  >();
  for (const row of sessionsInWindow) {
    if (!row.country) continue;
    const key = row.country.toUpperCase();
    const entry = countrySessions.get(key) ?? {
      sessions: 0,
      users: new Set<string>(),
    };
    entry.sessions += 1;
    entry.users.add(row.user_id);
    countrySessions.set(key, entry);
  }
  const countries: CountryPoint[] = [...countrySessions.entries()]
    .map(([country, stats]) => {
      const coords = COUNTRY_COORDS[country] ?? {
        x: 50 + ((country.charCodeAt(0) ?? 65) % 40) - 20,
        y: 45 + ((country.charCodeAt(1) ?? 65) % 30) - 15,
      };
      return {
        country,
        sessions: stats.sessions,
        users: stats.users.size,
        errors: 0,
        heartbeats: 0,
        x: coords.x,
        y: coords.y,
      };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 40);

  const allProjects = await admin
    .from("projects")
    .select("id, name, workspace_id")
    .order("name")
    .limit(500);
  if (allProjects.error) throw mapPostgrestError(allProjects.error);

  return {
    generatedAt: new Date().toISOString(),
    filters: { ...filters, range },
    executive: {
      dau,
      wau,
      mau,
      newUsers,
      retentionProxyPercent,
      churnProxyPercent,
      workspaceGrowth,
      projectGrowth,
      apiGrowth,
      aiRequests: aiRows.length,
      aiTokens,
      sdkAdoptionPercent,
    },
    series,
    users: usersBlock,
    workspaces: {
      growth: workspaceGrowth,
      totalProjects: projects.length,
      totalMembers: (membersRes.data ?? []).filter((m) =>
        workspaceMap.has(m.workspace_id),
      ).length,
      byPlan: countMap(workspaces.map((w) => w.plan)),
      apiEvents: successEvents,
      averageHealthScore:
        healthScores.length === 0 ? null : round(avg(healthScores) ?? 0),
      rows: workspaceRows
        .sort((a, b) => b.apiEvents - a.apiEvents)
        .slice(0, 25),
    },
    api: {
      requests,
      successEvents,
      failureEvents,
      successRate,
      errorRate,
      averageLatencyMs: avg(latencies),
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      p99Ms: percentile(latencies, 99),
      topEndpoints,
      byEnvironment: [...envCounts.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      trafficTrend: labels.map((label) => ({
        label,
        value: apiByDay.get(label) ?? 0,
      })),
    },
    ai: {
      requests: aiRows.length,
      tokens: aiTokens,
      byModel: [...modelMap.entries()]
        .map(([model, stats]) => ({
          model,
          requests: stats.requests,
          tokens: stats.tokens,
        }))
        .sort((a, b) => b.requests - a.requests),
      averageLatencyMs: null,
      successRate: null,
      dailyTrend: labels.map((label) => ({
        label,
        requests: aiTrend.get(label)?.requests ?? 0,
        tokens: aiTrend.get(label)?.tokens ?? 0,
      })),
    },
    sdk: {
      versions: [...versionMap.values()]
        .sort((a, b) => b.heartbeats - a.heartbeats)
        .slice(0, 25),
      installations: projectsWithSdk.size,
      heartbeats: hbRows.length,
      errors: (errorsRes.data ?? []).reduce(
        (sum, row) => sum + (row.occurrences ?? 1),
        0,
      ),
      byEnvironment: countMap(hbRows.map((row) => row.environment)),
      performanceSamples: (perfRes.data ?? []).length,
    },
    errors: {
      top: (errorsRes.data ?? []).slice(0, 15).map((err) => {
        const meta = projectMap.get(err.project_id);
        return {
          id: err.id,
          message: err.message,
          occurrences: err.occurrences,
          lastSeen: err.last_seen,
          projectId: err.project_id,
          projectName: meta?.name ?? "Project",
          workspaceId: meta?.workspaceId ?? "",
          workspaceName: meta?.workspaceName ?? "Workspace",
        };
      }),
      trend: labels.map((label) => ({
        label,
        value: errByDay.get(label) ?? 0,
      })),
      frequency: (errorsRes.data ?? []).reduce(
        (sum, row) => sum + (row.occurrences ?? 1),
        0,
      ),
      averageResolutionSeconds:
        resolutionSeconds.length === 0 ? null : avg(resolutionSeconds),
      affectedProjects: affectedProjects.size,
      affectedWorkspaces: affectedWorkspaces.size,
    },
    performance: {
      averageMs: avg(latencies),
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      p99Ms: percentile(latencies, 99),
      slowEndpoints,
    },
    geography: {
      countries,
      regions: countries.slice(0, 10).map((c) => ({
        label: c.country,
        value: c.sessions,
      })),
      cityNote:
        "City-level analytics are not stored. Map traffic uses session countries; error/heartbeat geo columns do not exist.",
    },
    filterOptions: {
      workspaces: (workspacesRes.data ?? []).map((w) => ({
        id: w.id,
        name: w.name,
      })),
      projects: (allProjects.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        workspaceId: p.workspace_id,
      })),
    },
    unavailable: [
      "session_duration",
      "cities",
      "ai_latency",
      "server_api_route_latency",
      "classic_subscription_churn",
      "error_geo",
    ],
  };
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function exportAnalyticsJson(
  role: AdminPlatformRole,
  filters: AnalyticsFilters,
): Promise<string> {
  const data = await getAnalyticsIntelligence(role, filters);
  return JSON.stringify(data, null, 2);
}

export async function exportAnalyticsCsv(
  role: AdminPlatformRole,
  filters: AnalyticsFilters,
): Promise<string> {
  const data = await getAnalyticsIntelligence(role, filters);
  const lines: string[] = [];
  lines.push("section,metric,label,value");
  const push = (section: string, metric: string, label: string, value: string | number | null) => {
    lines.push(
      [section, metric, label, value]
        .map((cell) => csvEscape(cell))
        .join(","),
    );
  };

  push("executive", "dau", "DAU", data.executive.dau);
  push("executive", "wau", "WAU", data.executive.wau);
  push("executive", "mau", "MAU", data.executive.mau);
  push("executive", "new_users", "New users", data.executive.newUsers);
  push(
    "executive",
    "retention_proxy_percent",
    "Retention proxy %",
    data.executive.retentionProxyPercent,
  );
  push(
    "executive",
    "churn_proxy_percent",
    "Churn proxy %",
    data.executive.churnProxyPercent,
  );
  push("executive", "workspace_growth", "Workspace growth", data.executive.workspaceGrowth);
  push("executive", "project_growth", "Project growth", data.executive.projectGrowth);
  push("executive", "api_growth", "API key growth", data.executive.apiGrowth);
  push("executive", "ai_requests", "AI requests", data.executive.aiRequests);
  push("executive", "ai_tokens", "AI tokens", data.executive.aiTokens);
  push(
    "executive",
    "sdk_adoption_percent",
    "SDK adoption %",
    data.executive.sdkAdoptionPercent,
  );

  for (const point of data.series) {
    push("series", "active_users", point.label, point.activeUsers);
    push("series", "new_users", point.label, point.newUsers);
    push("series", "api_events", point.label, point.apiEvents);
    push("series", "ai_requests", point.label, point.aiRequests);
    push("series", "errors", point.label, point.errors);
  }
  for (const row of data.users.countries) {
    push("users", "country", row.label, row.value);
  }
  for (const row of data.api.topEndpoints) {
    push("api", "endpoint_samples", row.url, row.samples);
    push("api", "endpoint_p95", row.url, row.p95Ms);
  }
  for (const row of data.ai.byModel) {
    push("ai", "model_requests", row.model, row.requests);
    push("ai", "model_tokens", row.model, row.tokens);
  }
  for (const row of data.errors.top) {
    push("errors", "occurrences", row.message, row.occurrences);
  }
  for (const row of data.geography.countries) {
    push("geography", "sessions", row.country, row.sessions);
  }

  return `${lines.join("\n")}\n`;
}
