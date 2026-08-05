import "server-only";

import { cronJobs } from "@/cron/registry";
import { MONITORING } from "@/lib/constants";
import { env } from "@/lib/env";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { avg, percentile, toMb } from "@/services/health/math";
import type { HealthTone } from "@/services/admin/executive-dashboard.types";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AlertItem,
  EndpointLatencyItem,
  IncidentPanelItem,
  LiveMetrics,
  MapCountryPoint,
  MonitoringMissionData,
  MonitoringMissionFilters,
  MonitoringRange,
  ProjectHealthSummary,
  StatusProbe,
  StreamEvent,
  TopErrorItem,
} from "@/services/admin/monitoring-mission.types";
import { uptimePercent, type DowntimeInterval } from "@/services/status/uptime";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type {
  ApiKeyEnvironment,
  EventLevel,
  IncidentSeverity,
} from "@/types/database";

/** Approximate SVG positions for common ISO country codes (viewBox 0–100). */
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 22, y: 38 },
  CA: { x: 22, y: 28 },
  MX: { x: 20, y: 48 },
  BR: { x: 35, y: 68 },
  AR: { x: 33, y: 78 },
  GB: { x: 48, y: 30 },
  IE: { x: 46, y: 30 },
  FR: { x: 50, y: 34 },
  DE: { x: 52, y: 32 },
  NL: { x: 50, y: 30 },
  ES: { x: 47, y: 38 },
  IT: { x: 53, y: 38 },
  TR: { x: 60, y: 38 },
  RU: { x: 68, y: 26 },
  IN: { x: 70, y: 48 },
  CN: { x: 78, y: 40 },
  JP: { x: 86, y: 38 },
  KR: { x: 84, y: 40 },
  AU: { x: 86, y: 72 },
  NZ: { x: 92, y: 78 },
  ZA: { x: 56, y: 72 },
  NG: { x: 52, y: 56 },
  EG: { x: 58, y: 44 },
  AE: { x: 64, y: 44 },
  SA: { x: 62, y: 46 },
  SE: { x: 54, y: 22 },
  NO: { x: 52, y: 20 },
  PL: { x: 54, y: 30 },
  PT: { x: 45, y: 38 },
  CH: { x: 51, y: 34 },
  AT: { x: 53, y: 34 },
  BE: { x: 50, y: 31 },
  SG: { x: 78, y: 58 },
  HK: { x: 80, y: 46 },
  TW: { x: 82, y: 46 },
  ID: { x: 80, y: 60 },
  PH: { x: 84, y: 54 },
  TH: { x: 76, y: 52 },
  VN: { x: 78, y: 50 },
  IL: { x: 60, y: 42 },
  CL: { x: 30, y: 76 },
  CO: { x: 28, y: 56 },
  PE: { x: 28, y: 62 },
};

function rangeToMs(range: MonitoringRange): number {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function resolveWindow(filters: MonitoringMissionFilters): {
  since: string;
  until: string;
  range: MonitoringRange;
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

function dayBuckets(sinceIso: string, untilIso: string): string[] {
  const start = new Date(sinceIso);
  const end = new Date(untilIso);
  const span = end.getTime() - start.getTime();
  if (span <= 36 * 60 * 60 * 1000) {
    const labels: string[] = [];
    const cursor = new Date(start);
    cursor.setUTCMinutes(0, 0, 0);
    while (cursor <= end) {
      labels.push(cursor.toISOString().slice(0, 13));
      cursor.setUTCHours(cursor.getUTCHours() + 1);
    }
    return labels.length ? labels : [start.toISOString().slice(0, 13)];
  }
  const labels: string[] = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  while (cursor <= end) {
    labels.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return labels;
}

function bucketKey(iso: string, hourly: boolean): string {
  return hourly ? iso.slice(0, 13) : iso.slice(0, 10);
}

function stackSummary(stack: string | null): string | null {
  if (!stack) return null;
  const line = stack
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  if (!line) return null;
  return line.length > 140 ? `${line.slice(0, 137)}…` : line;
}

function memoryFromHeartbeat(memory: unknown): number | null {
  if (!memory || typeof memory !== "object" || Array.isArray(memory)) return null;
  const record = memory as Record<string, unknown>;
  const candidates = [
    record.usedJSHeapSize,
    record.used,
    record.rss,
    record.heapUsed,
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return toMb(value);
    }
  }
  return null;
}

async function resolveProjectScope(
  filters: MonitoringMissionFilters,
): Promise<string[] | null> {
  const admin = createSupabaseAdminClient();
  if (filters.projectId) {
    return [filters.projectId];
  }
  if (!filters.workspaceId) return null;
  const { data, error } = await admin
    .from("projects")
    .select("id")
    .eq("workspace_id", filters.workspaceId);
  if (error) throw mapPostgrestError(error);
  return (data ?? []).map((row) => row.id);
}

async function loadProbes(sdkHeartbeatCount1h: number): Promise<{
  probes: StatusProbe[];
  platformTone: HealthTone;
  databaseLatencyMs: number | null;
}> {
  const admin = createSupabaseAdminClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let databaseTone: HealthTone = "green";
  let databaseDetail = "Postgres reachable";
  let databaseLatencyMs: number | null = null;
  try {
    const started = performance.now();
    const { error } = await admin.from("profiles").select("id").limit(1);
    databaseLatencyMs = Math.round(performance.now() - started);
    if (error) {
      databaseTone = "red";
      databaseDetail = error.message;
    } else {
      databaseDetail = `Postgres reachable · ${databaseLatencyMs} ms probe`;
    }
  } catch (error) {
    databaseTone = "red";
    databaseDetail =
      error instanceof Error ? error.message : "Database unreachable";
  }

  let storageTone: HealthTone = "yellow";
  let storageDetail = "Storage probe unavailable";
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      storageTone = "red";
      storageDetail = error.message;
    } else {
      const names = new Set((data ?? []).map((bucket) => bucket.name));
      const missing = ["avatars", "workspace-logos"].filter(
        (name) => !names.has(name),
      );
      if (missing.length > 0) {
        storageTone = "yellow";
        storageDetail = `Missing buckets: ${missing.join(", ")}`;
      } else {
        storageTone = "green";
        storageDetail = `${data?.length ?? 0} buckets configured`;
      }
    }
  } catch (error) {
    storageTone = "red";
    storageDetail =
      error instanceof Error ? error.message : "Storage unreachable";
  }

  const openaiConfigured = Boolean(env.OPENAI_API_KEY);
  const aiTone: HealthTone = openaiConfigured ? "green" : "yellow";
  const aiDetail = openaiConfigured
    ? `Model ${env.OPENAI_MODEL}`
    : "OPENAI_API_KEY not configured";

  const resendConfigured = Boolean(env.RESEND_API_KEY);
  const { count: mailFailed, error: mailErr } = await admin
    .from("notification_logs")
    .select("id", { count: "exact", head: true })
    .eq("channel", "email")
    .eq("status", "failed")
    .gte("created_at", dayAgo);
  if (mailErr) throw mapPostgrestError(mailErr);

  let mailTone: HealthTone = resendConfigured ? "green" : "yellow";
  let mailDetail = resendConfigured
    ? "Resend configured"
    : "RESEND_API_KEY not configured";
  if ((mailFailed ?? 0) > 0) {
    mailTone = "red";
    mailDetail = `${mailFailed} email failures (24h)`;
  }

  const [{ count: pending }, { count: failedQueue }] = await Promise.all([
    admin
      .from("notification_queue")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing"]),
    admin
      .from("notification_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  let queueTone: HealthTone = "green";
  let queueDetail = `${pending ?? 0} pending`;
  if ((failedQueue ?? 0) > 0) {
    queueTone = "red";
    queueDetail = `${failedQueue} failed · ${pending ?? 0} pending`;
  } else if ((pending ?? 0) > 100) {
    queueTone = "yellow";
    queueDetail = `${pending} pending (elevated)`;
  }

  const cronConfigured = Boolean(env.CRON_SECRET);
  const cronTone: HealthTone = cronConfigured ? "green" : "yellow";
  const cronDetail = cronConfigured
    ? "CRON_SECRET configured · run history not persisted"
    : "CRON_SECRET empty — schedules may be inactive";

  const apiTone: HealthTone = databaseTone === "red" ? "red" : "green";
  const apiDetail =
    databaseTone === "red"
      ? "API degraded — database errors"
      : "App API serving Mission Control";

  let sdkTone: HealthTone = "yellow";
  let sdkDetail = "No SDK heartbeats in the last hour";
  if (sdkHeartbeatCount1h > 0) {
    sdkTone = "green";
    sdkDetail = `${sdkHeartbeatCount1h} heartbeats (1h)`;
  }

  const tones: HealthTone[] = [
    databaseTone,
    apiTone,
    sdkTone,
    aiTone,
    cronTone,
    storageTone,
    mailTone,
    queueTone,
  ];
  let platformTone: HealthTone = "green";
  if (tones.includes("red")) platformTone = "red";
  else if (tones.includes("yellow")) platformTone = "yellow";

  const probes: StatusProbe[] = [
    {
      id: "platform",
      label: "Platform Status",
      tone: platformTone,
      detail:
        platformTone === "green"
          ? "All critical probes healthy"
          : "One or more subsystems need attention",
    },
    { id: "database", label: "Database", tone: databaseTone, detail: databaseDetail },
    { id: "api", label: "API", tone: apiTone, detail: apiDetail },
    { id: "sdk", label: "SDK", tone: sdkTone, detail: sdkDetail },
    { id: "ai", label: "AI", tone: aiTone, detail: aiDetail },
    { id: "cron", label: "Cron", tone: cronTone, detail: cronDetail },
    { id: "storage", label: "Storage", tone: storageTone, detail: storageDetail },
    { id: "mail", label: "Mail", tone: mailTone, detail: mailDetail },
    { id: "queue", label: "Queue", tone: queueTone, detail: queueDetail },
  ];

  return { probes, platformTone, databaseLatencyMs };
}

function classifyProject(input: {
  lastHeartbeatAt: string | null;
  openCritical: boolean;
  openIncidents: number;
  errorOccurrences: number;
  now: number;
}): ProjectHealthSummary["status"] {
  const stale =
    !input.lastHeartbeatAt ||
    input.now - new Date(input.lastHeartbeatAt).getTime() >
      MONITORING.heartbeatTimeoutMs;
  if (stale && input.lastHeartbeatAt) return "offline";
  if (!input.lastHeartbeatAt && input.openIncidents === 0 && input.errorOccurrences === 0) {
    return "offline";
  }
  if (input.openCritical || input.errorOccurrences >= 50) return "critical";
  if (input.openIncidents > 0 || input.errorOccurrences >= 10) return "warning";
  if (stale) return "offline";
  return "healthy";
}

function scoreFromStatus(
  status: ProjectHealthSummary["status"],
  errors: number,
  incidents: number,
): number | null {
  if (status === "offline") return 35;
  let score = 100;
  score -= Math.min(40, incidents * 12);
  score -= Math.min(35, Math.floor(errors / 2));
  if (status === "critical") score = Math.min(score, 55);
  if (status === "warning") score = Math.min(score, 82);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getMonitoringMissionControl(
  role: AdminPlatformRole,
  filters: MonitoringMissionFilters = {},
): Promise<MonitoringMissionData> {
  assertAdminPermission(role, "admin:monitoring:read");
  const admin = createSupabaseAdminClient();
  const { since, until, range } = resolveWindow(filters);
  const windowMs = Math.max(60_000, new Date(until).getTime() - new Date(since).getTime());
  const windowMinutes = windowMs / 60_000;
  const hourly = windowMs <= 36 * 60 * 60 * 1000;
  const labels = dayBuckets(since, until);
  const projectIds = await resolveProjectScope(filters);
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (projectIds && projectIds.length === 0) {
    const { probes, platformTone, databaseLatencyMs } = await loadProbes(0);
    return {
      generatedAt: new Date().toISOString(),
      filters: { ...filters, range },
      globalStatus: {
        platformTone,
        platformLabel:
          platformTone === "green"
            ? "Operational"
            : platformTone === "yellow"
              ? "Degraded"
              : "Outage",
        probes,
        responseTimeMs: null,
        uptimePercent30d: 100,
      },
      liveMetrics: {
        apiRequestsPerSec: 0,
        errorsPerMin: 0,
        heartbeatsPerMin: 0,
        aiRequestsPerMin: 0,
        averageResponseTimeMs: null,
        p95ResponseTimeMs: null,
        p99ResponseTimeMs: null,
        databaseLatencyMs,
        cpuAvailable: false,
        memoryMbAvg: null,
        uptimePercent30d: 100,
      },
      stream: [],
      geography: {
        countries: [],
        topRegions: [],
        cityNote: "City-level telemetry is not stored in this product.",
        requestProxyNote:
          "Live request geography uses authenticated session countries as a proxy.",
      },
      health: {
        counts: {
          healthy: 0,
          warning: 0,
          critical: 0,
          offline: 0,
          total: 0,
        },
        projects: [],
      },
      incidents: { open: [], monitoring: [], resolved: [] },
      errors: { top: [], newest: [], trend: labels.map((label) => ({ label, value: 0 })) },
      performance: { endpoints: [], slowest: [] },
      sdk: {
        versions: [],
        productionHeartbeats: 0,
        developmentHeartbeats: 0,
        stagingHeartbeats: 0,
        silentProjects: 0,
      },
      cron: cronJobs.map((job) => ({
        name: job.name,
        schedule: job.schedule,
        path: job.path,
        lastRun: null,
        nextRun: null,
        durationMs: null,
        failures: null,
        note: "Cron execution history is not persisted.",
      })),
      alerts: [],
      filterOptions: { workspaces: [], projects: [] },
      unavailable: [
        "cpu",
        "cities",
        "cron_history",
        "request_geo_on_errors",
      ],
    };
  }

  let projectsQuery = admin
    .from("projects")
    .select("id, name, workspace_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (projectIds) projectsQuery = projectsQuery.in("id", projectIds);

  const [
    projectsRes,
    workspacesRes,
    errorsRes,
    heartbeatsRes,
    perfRes,
    incidentsRes,
    keyLogsRes,
    notifRes,
    auditRes,
    aiRes,
    sessionsRes,
    hb1hRes,
  ] = await Promise.all([
    projectsQuery,
    admin.from("workspaces").select("id, name").order("name").limit(500),
    (() => {
      let q = admin
        .from("errors")
        .select(
          "id, project_id, message, stack, level, occurrences, last_seen, environment, fingerprint",
        )
        .gte("last_seen", since)
        .lte("last_seen", until)
        .order("occurrences", { ascending: false })
        .limit(2000);
      if (projectIds) q = q.in("project_id", projectIds);
      if (filters.environment) q = q.eq("environment", filters.environment);
      if (
        filters.severity &&
        ["debug", "info", "warning", "error", "fatal"].includes(filters.severity)
      ) {
        q = q.eq("level", filters.severity as EventLevel);
      }
      return q;
    })(),
    (() => {
      let q = admin
        .from("heartbeats")
        .select("id, project_id, occurred_at, environment, release, memory")
        .gte("occurred_at", since)
        .lte("occurred_at", until)
        .order("occurred_at", { ascending: false })
        .limit(5000);
      if (projectIds) q = q.in("project_id", projectIds);
      if (filters.environment) q = q.eq("environment", filters.environment);
      return q;
    })(),
    (() => {
      let q = admin
        .from("performance_logs")
        .select("id, project_id, url, ttfb, page_load, lcp, occurred_at, environment")
        .gte("occurred_at", since)
        .lte("occurred_at", until)
        .order("occurred_at", { ascending: false })
        .limit(5000);
      if (projectIds) q = q.in("project_id", projectIds);
      if (filters.environment) q = q.eq("environment", filters.environment);
      return q;
    })(),
    (() => {
      let q = admin
        .from("incidents")
        .select(
          "id, project_id, title, status, severity, detected_at, resolved_at, started_at, downtime_seconds",
        )
        .gte("detected_at", monthAgo)
        .order("detected_at", { ascending: false })
        .limit(500);
      if (projectIds) q = q.in("project_id", projectIds);
      if (
        filters.severity &&
        ["critical", "high", "medium", "low"].includes(filters.severity)
      ) {
        q = q.eq("severity", filters.severity as IncidentSeverity);
      }
      return q;
    })(),
    (() => {
      let q = admin
        .from("api_key_logs")
        .select("id, project_id, event, created_at, metadata")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .limit(3000);
      if (projectIds) q = q.in("project_id", projectIds);
      return q;
    })(),
    (() => {
      let q = admin
        .from("notification_logs")
        .select("id, project_id, type, channel, status, title, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .limit(500);
      if (projectIds) q = q.in("project_id", projectIds);
      return q;
    })(),
    (() => {
      let q = admin
        .from("audit_logs")
        .select("id, workspace_id, action, summary, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .limit(400);
      if (filters.workspaceId) q = q.eq("workspace_id", filters.workspaceId);
      return q;
    })(),
    admin
      .from("ai_usage")
      .select("id, user_id, model, total_tokens, created_at")
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false })
      .limit(3000),
    (() => {
      let q = admin
        .from("user_sessions")
        .select("user_id, country, last_active_at")
        .gte("last_active_at", since)
        .not("country", "is", null)
        .limit(8000);
      if (filters.country?.trim()) {
        q = q.ilike("country", filters.country.trim());
      }
      return q;
    })(),
    (() => {
      let q = admin
        .from("heartbeats")
        .select("id", { count: "exact", head: true })
        .gte("occurred_at", hourAgo);
      if (projectIds) q = q.in("project_id", projectIds);
      return q;
    })(),
  ]);

  for (const result of [
    projectsRes,
    workspacesRes,
    errorsRes,
    heartbeatsRes,
    perfRes,
    incidentsRes,
    keyLogsRes,
    notifRes,
    auditRes,
    aiRes,
    sessionsRes,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }
  if (hb1hRes.error) throw mapPostgrestError(hb1hRes.error);

  const projects = projectsRes.data ?? [];
  const workspaceMap = new Map(
    (workspacesRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const projectMap = new Map(
    projects.map((row) => [
      row.id,
      {
        name: row.name,
        workspaceId: row.workspace_id,
        workspaceName: workspaceMap.get(row.workspace_id) ?? "Workspace",
      },
    ]),
  );

  const { probes, platformTone, databaseLatencyMs } = await loadProbes(
    hb1hRes.count ?? 0,
  );

  const ttfbValues = (perfRes.data ?? [])
    .map((row) => row.ttfb)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  const pageLoadValues = (perfRes.data ?? [])
    .map((row) => row.page_load)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  const latencySource =
    ttfbValues.length > 0 ? ttfbValues : pageLoadValues;

  const downtime: DowntimeInterval[] = (incidentsRes.data ?? []).map((inc) => {
    const start = new Date(inc.started_at).getTime();
    if (inc.resolved_at) {
      return { start, end: new Date(inc.resolved_at).getTime() };
    }
    if (inc.downtime_seconds != null && inc.downtime_seconds > 0) {
      return { start, end: start + inc.downtime_seconds * 1000 };
    }
    return { start, end: now };
  });
  const uptimePercent30d = uptimePercent(
    downtime,
    now - 30 * 24 * 60 * 60 * 1000,
    now,
  );

  const apiCount = (keyLogsRes.data ?? []).length;
  const errorCount = (errorsRes.data ?? []).reduce(
    (sum, row) => sum + (row.occurrences ?? 1),
    0,
  );
  const heartbeatCount = (heartbeatsRes.data ?? []).length;
  const aiCount = (aiRes.data ?? []).length;

  const memorySamples = (heartbeatsRes.data ?? [])
    .map((row) => memoryFromHeartbeat(row.memory))
    .filter((value): value is number => value != null);

  const liveMetrics: LiveMetrics = {
    apiRequestsPerSec:
      Math.round((apiCount / Math.max(1, windowMs / 1000)) * 100) / 100,
    errorsPerMin: Math.round((errorCount / Math.max(1, windowMinutes)) * 100) / 100,
    heartbeatsPerMin:
      Math.round((heartbeatCount / Math.max(1, windowMinutes)) * 100) / 100,
    aiRequestsPerMin:
      Math.round((aiCount / Math.max(1, windowMinutes)) * 100) / 100,
    averageResponseTimeMs: avg(latencySource),
    p95ResponseTimeMs: percentile(latencySource, 95),
    p99ResponseTimeMs: percentile(latencySource, 99),
    databaseLatencyMs,
    cpuAvailable: false,
    memoryMbAvg: avg(memorySamples),
    uptimePercent30d,
  };

  // Geography
  const countrySessions = new Map<string, { sessions: number; users: Set<string> }>();
  for (const row of sessionsRes.data ?? []) {
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
  const countries: MapCountryPoint[] = [...countrySessions.entries()]
    .map(([country, stats]) => {
      const coords = COUNTRY_COORDS[country] ?? {
        x: 50 + ((country.charCodeAt(0) ?? 65) % 40) - 20,
        y: 45 + ((country.charCodeAt(1) ?? 65) % 30) - 15,
      };
      return {
        country,
        sessions: stats.sessions,
        users: stats.users.size,
        x: coords.x,
        y: coords.y,
      };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 40);

  const topRegions = countries.slice(0, 8).map((row) => ({
    label: row.country,
    sessions: row.sessions,
  }));

  // Project health
  const lastHb = new Map<string, string>();
  const hbEnv = new Map<string, ApiKeyEnvironment>();
  for (const row of heartbeatsRes.data ?? []) {
    if (!lastHb.has(row.project_id)) {
      lastHb.set(row.project_id, row.occurred_at);
      hbEnv.set(row.project_id, row.environment);
    }
  }
  // Also check recent heartbeats outside selected window for "last seen"
  if (projects.length > 0) {
    const { data: latestHb } = await admin
      .from("heartbeats")
      .select("project_id, occurred_at, environment")
      .in(
        "project_id",
        projects.map((p) => p.id),
      )
      .order("occurred_at", { ascending: false })
      .limit(2000);
    for (const row of latestHb ?? []) {
      const prev = lastHb.get(row.project_id);
      if (!prev || row.occurred_at > prev) {
        lastHb.set(row.project_id, row.occurred_at);
        hbEnv.set(row.project_id, row.environment);
      }
    }
  }

  const openByProject = new Map<string, { total: number; critical: boolean }>();
  for (const inc of incidentsRes.data ?? []) {
    if (inc.status === "resolved") continue;
    const entry = openByProject.get(inc.project_id) ?? {
      total: 0,
      critical: false,
    };
    entry.total += 1;
    if (inc.severity === "critical") entry.critical = true;
    openByProject.set(inc.project_id, entry);
  }
  const isOpenIncident = (status: string) =>
    status === "investigating" || status === "identified";
  const errorsByProject = new Map<string, number>();
  for (const err of errorsRes.data ?? []) {
    errorsByProject.set(
      err.project_id,
      (errorsByProject.get(err.project_id) ?? 0) + (err.occurrences ?? 1),
    );
  }

  const healthProjects: ProjectHealthSummary[] = projects.map((project) => {
    const open = openByProject.get(project.id) ?? { total: 0, critical: false };
    const errors = errorsByProject.get(project.id) ?? 0;
    const lastHeartbeatAt = lastHb.get(project.id) ?? null;
    const status = classifyProject({
      lastHeartbeatAt,
      openCritical: open.critical,
      openIncidents: open.total,
      errorOccurrences: errors,
      now,
    });
    return {
      projectId: project.id,
      workspaceId: project.workspace_id,
      workspaceName: workspaceMap.get(project.workspace_id) ?? "Workspace",
      name: project.name,
      status,
      score: scoreFromStatus(status, errors, open.total),
      lastHeartbeatAt,
      openIncidents: open.total,
      environment: hbEnv.get(project.id) ?? null,
    };
  });

  const counts = {
    healthy: healthProjects.filter((p) => p.status === "healthy").length,
    warning: healthProjects.filter((p) => p.status === "warning").length,
    critical: healthProjects.filter((p) => p.status === "critical").length,
    offline: healthProjects.filter((p) => p.status === "offline").length,
    total: healthProjects.length,
  };

  const toIncidentItem = (inc: {
    id: string;
    project_id: string;
    title: string;
    status: IncidentPanelItem["status"];
    severity: IncidentPanelItem["severity"];
    detected_at: string;
    resolved_at: string | null;
  }): IncidentPanelItem => {
    const meta = projectMap.get(inc.project_id);
    return {
      id: inc.id,
      title: inc.title,
      status: inc.status,
      severity: inc.severity,
      projectId: inc.project_id,
      projectName: meta?.name ?? "Project",
      workspaceId: meta?.workspaceId ?? "",
      workspaceName: meta?.workspaceName ?? "Workspace",
      detectedAt: inc.detected_at,
      resolvedAt: inc.resolved_at,
    };
  };

  const incidentItems = (incidentsRes.data ?? []).map(toIncidentItem);
  const incidents = {
    open: incidentItems.filter((i) => isOpenIncident(i.status)),
    monitoring: incidentItems.filter((i) => i.status === "monitoring"),
    resolved: incidentItems
      .filter((i) => i.status === "resolved")
      .slice(0, 30),
  };

  const mapError = (err: {
    id: string;
    project_id: string;
    message: string;
    stack: string | null;
    level: EventLevel;
    occurrences: number;
    last_seen: string;
    environment: ApiKeyEnvironment;
  }): TopErrorItem => ({
    id: err.id,
    message: err.message,
    level: err.level,
    occurrences: err.occurrences,
    lastSeen: err.last_seen,
    projectId: err.project_id,
    projectName: projectMap.get(err.project_id)?.name ?? "Project",
    environment: err.environment,
    stackSummary: stackSummary(err.stack),
  });

  const errorRows = errorsRes.data ?? [];
  const topErrors = errorRows.slice(0, 12).map(mapError);
  const newestErrors = [...errorRows]
    .sort(
      (a, b) =>
        new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime(),
    )
    .slice(0, 12)
    .map(mapError);

  const trendMap = new Map(labels.map((label) => [label, 0]));
  for (const err of errorRows) {
    const key = bucketKey(err.last_seen, hourly);
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + (err.occurrences ?? 1));
    }
  }
  const errorTrend = labels.map((label) => ({
    label,
    value: trendMap.get(label) ?? 0,
  }));

  // Performance endpoints
  const endpointMap = new Map<string, number[]>();
  for (const row of perfRes.data ?? []) {
    const url = row.url?.trim() || "(unknown)";
    const latency = row.ttfb ?? row.page_load;
    if (latency == null) continue;
    const list = endpointMap.get(url) ?? [];
    list.push(latency);
    endpointMap.set(url, list);
  }
  const endpoints: EndpointLatencyItem[] = [...endpointMap.entries()]
    .map(([url, samples]) => {
      const sorted = [...samples].sort((a, b) => a - b);
      return {
        url,
        samples: sorted.length,
        avgMs: avg(sorted),
        p95Ms: percentile(sorted, 95),
        p99Ms: percentile(sorted, 99),
      };
    })
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 15);
  const slowest = [...endpoints]
    .sort((a, b) => (b.p95Ms ?? 0) - (a.p95Ms ?? 0))
    .slice(0, 10);

  // SDK versions
  const versionMap = new Map<
    string,
    { release: string; environment: ApiKeyEnvironment; heartbeats: number; lastSeen: string }
  >();
  let productionHeartbeats = 0;
  let developmentHeartbeats = 0;
  let stagingHeartbeats = 0;
  for (const row of heartbeatsRes.data ?? []) {
    if (row.environment === "production") productionHeartbeats += 1;
    else if (row.environment === "development") developmentHeartbeats += 1;
    else stagingHeartbeats += 1;
    const release = row.release?.trim() || "unknown";
    const key = `${release}::${row.environment}`;
    const prev = versionMap.get(key);
    if (!prev) {
      versionMap.set(key, {
        release,
        environment: row.environment,
        heartbeats: 1,
        lastSeen: row.occurred_at,
      });
    } else {
      prev.heartbeats += 1;
      if (row.occurred_at > prev.lastSeen) prev.lastSeen = row.occurred_at;
    }
  }

  // Stream
  const stream: StreamEvent[] = [];
  for (const err of (errorsRes.data ?? []).slice(0, 40)) {
    stream.push({
      id: `err-${err.id}`,
      kind: "error",
      title: err.message,
      detail: `${err.level} · ${projectMap.get(err.project_id)?.name ?? "Project"} · ${err.occurrences}×`,
      occurredAt: err.last_seen,
      severity: err.level,
      projectId: err.project_id,
      workspaceId: projectMap.get(err.project_id)?.workspaceId,
      environment: err.environment,
    });
  }
  for (const hb of (heartbeatsRes.data ?? []).slice(0, 40)) {
    stream.push({
      id: `hb-${hb.id}`,
      kind: "heartbeat",
      title: "Heartbeat",
      detail: `${projectMap.get(hb.project_id)?.name ?? "Project"} · ${hb.environment}${
        hb.release ? ` · ${hb.release}` : ""
      }`,
      occurredAt: hb.occurred_at,
      projectId: hb.project_id,
      workspaceId: projectMap.get(hb.project_id)?.workspaceId,
      environment: hb.environment,
    });
  }
  for (const perf of (perfRes.data ?? []).slice(0, 30)) {
    stream.push({
      id: `perf-${perf.id}`,
      kind: "performance",
      title: "Performance sample",
      detail: [
        perf.url ?? "page",
        perf.ttfb != null ? `TTFB ${Math.round(perf.ttfb)}ms` : null,
        perf.lcp != null ? `LCP ${Math.round(perf.lcp)}ms` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      occurredAt: perf.occurred_at,
      projectId: perf.project_id,
      workspaceId: projectMap.get(perf.project_id)?.workspaceId,
      environment: perf.environment,
    });
  }
  for (const inc of (incidentsRes.data ?? []).slice(0, 30)) {
    stream.push({
      id: `inc-${inc.id}`,
      kind: "incident",
      title: inc.title,
      detail: `${inc.severity} · ${inc.status} · ${
        projectMap.get(inc.project_id)?.name ?? "Project"
      }`,
      occurredAt: inc.detected_at,
      severity: inc.severity,
      projectId: inc.project_id,
      workspaceId: projectMap.get(inc.project_id)?.workspaceId,
    });
  }
  for (const note of (notifRes.data ?? []).slice(0, 30)) {
    stream.push({
      id: `ntf-${note.id}`,
      kind: "notification",
      title: note.title,
      detail: `${note.channel} · ${note.status} · ${note.type}`,
      occurredAt: note.created_at,
      projectId: note.project_id,
    });
  }
  for (const log of (keyLogsRes.data ?? []).slice(0, 40)) {
    stream.push({
      id: `key-${log.id}`,
      kind: "api_key",
      title: `API key ${log.event}`,
      detail: projectMap.get(log.project_id ?? "")?.name ?? "API activity",
      occurredAt: log.created_at,
      projectId: log.project_id,
      workspaceId: log.project_id
        ? projectMap.get(log.project_id)?.workspaceId
        : null,
    });
  }
  for (const audit of (auditRes.data ?? []).slice(0, 30)) {
    stream.push({
      id: `ws-${audit.id}`,
      kind: "workspace",
      title: audit.action,
      detail: audit.summary,
      occurredAt: audit.created_at,
      workspaceId: audit.workspace_id,
    });
  }
  for (const ai of (aiRes.data ?? []).slice(0, 30)) {
    stream.push({
      id: `ai-${ai.id}`,
      kind: "ai",
      title: `AI · ${ai.model}`,
      detail: `${ai.total_tokens} tokens`,
      occurredAt: ai.created_at,
    });
  }
  stream.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  // Alerts from open incidents + failed notifications + queue
  const alerts: AlertItem[] = [];
  for (const inc of incidents.open.slice(0, 20)) {
    alerts.push({
      id: `alert-inc-${inc.id}`,
      title: inc.title,
      severity: inc.severity,
      source: `Incident · ${inc.projectName}`,
      acknowledged: inc.status === "monitoring",
      resolved: false,
      occurredAt: inc.detectedAt,
    });
  }
  for (const note of (notifRes.data ?? []).filter((n) => n.status === "failed").slice(0, 10)) {
    alerts.push({
      id: `alert-mail-${note.id}`,
      title: note.title,
      severity: "high",
      source: `Notification · ${note.channel}`,
      acknowledged: false,
      resolved: false,
      occurredAt: note.created_at,
    });
  }

  const filterProjects = (workspacesRes.data ?? []).length
    ? (
        await admin
          .from("projects")
          .select("id, name, workspace_id")
          .order("name")
          .limit(500)
      ).data ?? []
    : [];

  return {
    generatedAt: new Date().toISOString(),
    filters: { ...filters, range },
    globalStatus: {
      platformTone,
      platformLabel:
        platformTone === "green"
          ? "Operational"
          : platformTone === "yellow"
            ? "Degraded"
            : "Outage",
      probes,
      responseTimeMs: liveMetrics.averageResponseTimeMs,
      uptimePercent30d,
    },
    liveMetrics,
    stream: stream.slice(0, 120),
    geography: {
      countries,
      topRegions,
      cityNote: "City-level telemetry is not stored in this product.",
      requestProxyNote:
        "Map activity uses authenticated session countries (live request IP geo is not stored on errors/heartbeats).",
    },
    health: {
      counts,
      projects: healthProjects
        .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
        .slice(0, 40),
    },
    incidents,
    errors: {
      top: topErrors,
      newest: newestErrors,
      trend: errorTrend,
    },
    performance: { endpoints, slowest },
    sdk: {
      versions: [...versionMap.values()]
        .sort((a, b) => b.heartbeats - a.heartbeats)
        .slice(0, 20),
      productionHeartbeats,
      developmentHeartbeats,
      stagingHeartbeats,
      silentProjects: counts.offline,
    },
    cron: cronJobs.map((job) => ({
      name: job.name,
      schedule: job.schedule,
      path: job.path,
      lastRun: null,
      nextRun: null,
      durationMs: null,
      failures: null,
      note: "Cron execution history is not persisted. Schedules reflect registry definitions.",
    })),
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
      projects: filterProjects.map((row) => ({
        id: row.id,
        name: row.name,
        workspaceId: row.workspace_id,
      })),
    },
    unavailable: [
      "cpu",
      "cities",
      "cron_history",
      "request_geo_on_errors",
    ],
  };
}
