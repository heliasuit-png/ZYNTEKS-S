import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { ADMIN_ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { uptimePercent, type DowntimeInterval } from "@/services/status/uptime";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  ActivityFeedItem,
  AiOverviewStats,
  ApiEndpointStat,
  CountryUsageRow,
  DashboardRange,
  ExecutiveDashboardData,
  ExecutiveKpis,
  HealthTone,
  IncidentSummaryItem,
  MonitoringComponentStatus,
  SecurityOverview,
  UsageSeriesPoint,
} from "@/services/admin/executive-dashboard.types";
import type { IncidentStatus } from "@/types/database";

function rangeToMs(range: DashboardRange): number {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function countTable(
  build: () => PromiseLike<{ count: number | null; error: PostgrestError | null }>,
): Promise<number> {
  const { count, error } = await build();
  if (error) throw mapPostgrestError(error);
  return count ?? 0;
}

function bump(bucket: Record<string, number>, key: string): void {
  const current = bucket[key];
  if (current !== undefined) {
    bucket[key] = current + 1;
  }
}

function bucketLabels(range: DashboardRange): string[] {
  const now = new Date();
  if (range === "24h") {
    const labels: string[] = [];
    for (let i = 23; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(
        `${String(d.getUTCHours()).padStart(2, "0")}:00`,
      );
    }
    return labels;
  }
  const days = range === "7d" ? 7 : 30;
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    labels.push(d.toISOString().slice(0, 10));
  }
  return labels;
}

function bucketKey(iso: string, range: DashboardRange): string {
  const d = new Date(iso);
  if (range === "24h") {
    return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
  }
  return d.toISOString().slice(0, 10);
}

async function loadKpis(): Promise<ExecutiveKpis> {
  const admin = createSupabaseAdminClient();
  const todayStart = startOfUtcDay(new Date()).toISOString();
  const dayAgo = isoHoursAgo(24);
  const thirtyDaysAgo = isoDaysAgo(30);

  const [
    totalUsers,
    activeSessionRows,
    totalWorkspaces,
    totalProjects,
    totalApiKeys,
    aiRequestsToday,
    errorsToday,
    openIncidents,
    perfRows,
    incidentRows,
  ] = await Promise.all([
    countTable(() =>
      admin.from("profiles").select("id", { count: "exact", head: true }),
    ),
    admin
      .from("user_sessions")
      .select("user_id")
      .gte("last_active_at", dayAgo)
      .is("revoked_at", null)
      .limit(10000),
    countTable(() =>
      admin.from("workspaces").select("id", { count: "exact", head: true }),
    ),
    countTable(() =>
      admin.from("projects").select("id", { count: "exact", head: true }),
    ),
    countTable(() =>
      admin
        .from("api_keys")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    countTable(() =>
      admin
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart),
    ),
    countTable(() =>
      admin
        .from("errors")
        .select("id", { count: "exact", head: true })
        .gte("last_seen", todayStart),
    ),
    countTable(() =>
      admin
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .neq("status", "resolved"),
    ),
    admin
      .from("performance_logs")
      .select("ttfb")
      .gte("occurred_at", dayAgo)
      .not("ttfb", "is", null)
      .limit(2000),
    admin
      .from("incidents")
      .select("started_at, resolved_at, downtime_seconds")
      .gte("started_at", thirtyDaysAgo)
      .limit(2000),
  ]);

  if (activeSessionRows.error) {
    throw mapPostgrestError(activeSessionRows.error);
  }
  const activeUsers24h = new Set(
    (activeSessionRows.data ?? []).map((row) => row.user_id),
  ).size;

  if (perfRows.error) throw mapPostgrestError(perfRows.error);
  if (incidentRows.error) throw mapPostgrestError(incidentRows.error);

  const ttfbValues = (perfRows.data ?? [])
    .map((row) => row.ttfb)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const averageResponseTimeMs =
    ttfbValues.length > 0
      ? Math.round(
          ttfbValues.reduce((sum, v) => sum + v, 0) / ttfbValues.length,
        )
      : null;

  const windowEnd = Date.now();
  const windowStart = windowEnd - 30 * 24 * 60 * 60 * 1000;
  const intervals: DowntimeInterval[] = (incidentRows.data ?? []).map((row) => {
    const start = new Date(row.started_at).getTime();
    const end = row.resolved_at
      ? new Date(row.resolved_at).getTime()
      : windowEnd;
    return { start, end };
  });

  return {
    totalUsers,
    activeUsers24h,
    totalWorkspaces,
    totalProjects,
    totalApiKeys,
    aiRequestsToday,
    errorsToday,
    openIncidents,
    averageResponseTimeMs,
    uptimePercent30d: uptimePercent(intervals, windowStart, windowEnd),
  };
}

async function loadActivity(limit = 40): Promise<ActivityFeedItem[]> {
  const admin = createSupabaseAdminClient();
  const since = isoDaysAgo(14);

  const [profiles, workspaces, keys, errors, incidents, aiUsage, notifications] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, email, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("workspaces")
        .select("id, name, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("api_keys")
        .select("id, name, key_prefix, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("errors")
        .select("id, message, level, last_seen")
        .gte("last_seen", since)
        .order("last_seen", { ascending: false })
        .limit(20),
      admin
        .from("incidents")
        .select("id, title, severity, detected_at")
        .gte("detected_at", since)
        .order("detected_at", { ascending: false })
        .limit(20),
      admin
        .from("ai_usage")
        .select("id, model, total_tokens, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("notification_logs")
        .select("id, title, type, status, created_at")
        .eq("status", "sent")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  for (const result of [
    profiles,
    workspaces,
    keys,
    errors,
    incidents,
    aiUsage,
    notifications,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const items: ActivityFeedItem[] = [];

  for (const row of profiles.data ?? []) {
    items.push({
      id: `user-${row.id}`,
      kind: "user_created",
      title: "User Created",
      description: row.email,
      occurredAt: row.created_at,
    });
  }
  for (const row of workspaces.data ?? []) {
    items.push({
      id: `ws-${row.id}`,
      kind: "workspace_created",
      title: "Workspace Created",
      description: row.name,
      occurredAt: row.created_at,
    });
  }
  for (const row of keys.data ?? []) {
    items.push({
      id: `key-${row.id}`,
      kind: "api_key_generated",
      title: "API Key Generated",
      description: `${row.name} (${row.key_prefix}…)`,
      occurredAt: row.created_at,
    });
  }
  for (const row of errors.data ?? []) {
    items.push({
      id: `err-${row.id}`,
      kind: "error_received",
      title: "Error Received",
      description: `[${row.level}] ${row.message}`,
      occurredAt: row.last_seen,
    });
  }
  for (const row of incidents.data ?? []) {
    items.push({
      id: `inc-${row.id}`,
      kind: "incident_opened",
      title: "Incident Opened",
      description: `${row.title} · ${row.severity}`,
      occurredAt: row.detected_at,
    });
  }
  for (const row of aiUsage.data ?? []) {
    items.push({
      id: `ai-${row.id}`,
      kind: "ai_analysis",
      title: "AI Analysis",
      description: `${row.model} · ${row.total_tokens} tokens`,
      occurredAt: row.created_at,
    });
  }
  for (const row of notifications.data ?? []) {
    items.push({
      id: `notif-${row.id}`,
      kind: "notification_sent",
      title: "Notification Sent",
      description: row.title || row.type,
      occurredAt: row.created_at,
    });
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}

async function loadMonitoring(): Promise<MonitoringComponentStatus[]> {
  const admin = createSupabaseAdminClient();
  const dayAgo = isoHoursAgo(24);

  let databaseTone: HealthTone = "green";
  let databaseDetail = "Postgres reachable";
  try {
    const { error } = await admin.from("profiles").select("id").limit(1);
    if (error) {
      databaseTone = "red";
      databaseDetail = error.message;
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
      const names = new Set((data ?? []).map((b) => b.name));
      const required = ["avatars", "workspace-logos"];
      const missing = required.filter((name) => !names.has(name));
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
  let aiTone: HealthTone = openaiConfigured ? "green" : "yellow";
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
  let cronTone: HealthTone = cronConfigured ? "green" : "yellow";
  const cronDetail = cronConfigured
    ? "CRON_SECRET configured (run history not persisted)"
    : "CRON_SECRET empty — Vercel cron disabled or unset";

  const { count: recentHeartbeats } = await admin
    .from("heartbeats")
    .select("id", { count: "exact", head: true })
    .gte("occurred_at", isoHoursAgo(1));

  let apiTone: HealthTone = databaseTone === "red" ? "red" : "green";
  const apiDetail =
    databaseTone === "red"
      ? "API degraded — database errors"
      : "App API serving this dashboard";

  const tones: HealthTone[] = [
    databaseTone,
    storageTone,
    aiTone,
    mailTone,
    queueTone,
    cronTone,
    apiTone,
  ];
  let systemTone: HealthTone = "green";
  if (tones.includes("red")) systemTone = "red";
  else if (tones.includes("yellow")) systemTone = "yellow";

  return [
    {
      id: "system",
      label: "System Health",
      tone: systemTone,
      detail:
        systemTone === "green"
          ? "All critical probes healthy"
          : "One or more subsystems need attention",
    },
    {
      id: "database",
      label: "Database",
      tone: databaseTone,
      detail: databaseDetail,
    },
    {
      id: "api",
      label: "API",
      tone: apiTone,
      detail: apiDetail,
    },
    {
      id: "storage",
      label: "Storage",
      tone: storageTone,
      detail: storageDetail,
    },
    {
      id: "ai",
      label: "AI",
      tone: aiTone,
      detail: aiDetail,
    },
    {
      id: "mail",
      label: "Mail",
      tone: mailTone,
      detail: mailDetail,
    },
    {
      id: "queue",
      label: "Queue",
      tone: queueTone,
      detail: queueDetail,
    },
    {
      id: "cron",
      label: "Cron",
      tone: cronTone,
      detail: `${cronDetail}${
        typeof recentHeartbeats === "number"
          ? ` · ${recentHeartbeats} heartbeats (1h)`
          : ""
      }`,
    },
  ];
}

async function loadUsage(range: DashboardRange): Promise<UsageSeriesPoint[]> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - rangeToMs(range)).toISOString();
  const labels = bucketLabels(range);

  const empty = (): Record<string, number> =>
    Object.fromEntries(labels.map((label) => [label, 0]));

  const users = empty();
  const errors = empty();
  const aiRequests = empty();
  const projects = empty();
  const apiCalls = empty();

  const [profileRows, errorRows, aiRows, projectRows, keyLogRows] =
    await Promise.all([
      admin
        .from("profiles")
        .select("created_at")
        .gte("created_at", since)
        .limit(5000),
      admin
        .from("errors")
        .select("last_seen")
        .gte("last_seen", since)
        .limit(5000),
      admin
        .from("ai_usage")
        .select("created_at")
        .gte("created_at", since)
        .limit(5000),
      admin
        .from("projects")
        .select("created_at")
        .gte("created_at", since)
        .limit(5000),
      admin
        .from("api_key_logs")
        .select("created_at")
        .in("event", ["used", "auth_success"])
        .gte("created_at", since)
        .limit(5000),
    ]);

  for (const result of [profileRows, errorRows, aiRows, projectRows, keyLogRows]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  for (const row of profileRows.data ?? []) {
    bump(users, bucketKey(row.created_at, range));
  }
  for (const row of errorRows.data ?? []) {
    bump(errors, bucketKey(row.last_seen, range));
  }
  for (const row of aiRows.data ?? []) {
    bump(aiRequests, bucketKey(row.created_at, range));
  }
  for (const row of projectRows.data ?? []) {
    bump(projects, bucketKey(row.created_at, range));
  }
  for (const row of keyLogRows.data ?? []) {
    bump(apiCalls, bucketKey(row.created_at, range));
  }

  return labels.map((label) => ({
    label,
    users: users[label] ?? 0,
    errors: errors[label] ?? 0,
    aiRequests: aiRequests[label] ?? 0,
    projects: projects[label] ?? 0,
    apiCalls: apiCalls[label] ?? 0,
  }));
}

async function loadGeography(): Promise<{
  countries: CountryUsageRow[];
  cityNote: string;
}> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_sessions")
    .select("country, user_id")
    .not("country", "is", null)
    .limit(5000);
  if (error) throw mapPostgrestError(error);

  const byCountry = new Map<string, { sessions: number; users: Set<string> }>();
  for (const row of data ?? []) {
    const country = (row.country ?? "").trim().toUpperCase();
    if (!country) continue;
    const entry = byCountry.get(country) ?? {
      sessions: 0,
      users: new Set<string>(),
    };
    entry.sessions += 1;
    entry.users.add(row.user_id);
    byCountry.set(country, entry);
  }

  const countries = [...byCountry.entries()]
    .map(([country, value]) => ({
      country,
      sessions: value.sessions,
      users: value.users.size,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 12);

  return {
    countries,
    cityNote:
      "City-level geography is not stored. Country totals come from authenticated session headers (e.g. Vercel geo) when present.",
  };
}

async function loadSecurity(): Promise<SecurityOverview> {
  const admin = createSupabaseAdminClient();
  const dayAgo = isoHoursAgo(24);

  const [{ count: failedCount, error: countError }, { data: failed, error }] =
    await Promise.all([
      admin
        .from("api_key_logs")
        .select("id", { count: "exact", head: true })
        .eq("event", "auth_failed")
        .gte("created_at", dayAgo),
      admin
        .from("api_key_logs")
        .select("id, ip_address, created_at, metadata, event")
        .eq("event", "auth_failed")
        .gte("created_at", dayAgo)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
  if (countError) throw mapPostgrestError(countError);
  if (error) throw mapPostgrestError(error);

  const newest = (failed ?? []).slice(0, 12).map((row) => ({
    id: row.id,
    kind: "auth_failed" as const,
    title: "API key authentication failed",
    detail: row.ip_address ? `IP ${row.ip_address}` : "IP unknown",
    occurredAt: row.created_at,
  }));

  return {
    failedApiKeyAuth24h: failedCount ?? 0,
    blockedSignal:
      "Product login failures are not mirrored into app tables (Supabase Auth). Showing API key auth failures only.",
    rateLimitNote:
      "Rate limits are enforced in-process and are not persisted; historical 429 analytics are unavailable.",
    suspiciousCount24h: failedCount ?? 0,
    newest,
  };
}

async function loadIncidents(): Promise<ExecutiveDashboardData["incidents"]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("incidents")
    .select(
      "id, title, status, severity, project_id, detected_at, resolved_at",
    )
    .order("detected_at", { ascending: false })
    .limit(60);
  if (error) throw mapPostgrestError(error);

  const mapRow = (row: {
    id: string;
    title: string;
    status: IncidentStatus;
    severity: IncidentSummaryItem["severity"];
    project_id: string;
    detected_at: string;
    resolved_at: string | null;
  }): IncidentSummaryItem => ({
    id: row.id,
    title: row.title,
    status: row.status,
    severity: row.severity,
    projectId: row.project_id,
    detectedAt: row.detected_at,
    resolvedAt: row.resolved_at,
  });

  const rows = (data ?? []).map(mapRow);
  return {
    open: rows
      .filter((row) => row.status === "investigating" || row.status === "identified")
      .slice(0, 8),
    monitoring: rows.filter((row) => row.status === "monitoring").slice(0, 8),
    resolved: rows.filter((row) => row.status === "resolved").slice(0, 8),
  };
}

async function loadApiOverview(range: DashboardRange): Promise<ApiEndpointStat[]> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - rangeToMs(range)).toISOString();

  const [perf, errs] = await Promise.all([
    admin
      .from("performance_logs")
      .select("url, ttfb")
      .gte("occurred_at", since)
      .limit(4000),
    admin
      .from("errors")
      .select("url")
      .gte("last_seen", since)
      .limit(4000),
  ]);
  if (perf.error) throw mapPostgrestError(perf.error);
  if (errs.error) throw mapPostgrestError(errs.error);

  type Acc = { traffic: number; failures: number; latencySum: number; latencyN: number };
  const map = new Map<string, Acc>();

  for (const row of perf.data ?? []) {
    const endpoint = (row.url || "/").slice(0, 120);
    const acc = map.get(endpoint) ?? {
      traffic: 0,
      failures: 0,
      latencySum: 0,
      latencyN: 0,
    };
    acc.traffic += 1;
    if (typeof row.ttfb === "number") {
      acc.latencySum += row.ttfb;
      acc.latencyN += 1;
    }
    map.set(endpoint, acc);
  }
  for (const row of errs.data ?? []) {
    const endpoint = (row.url || "/").slice(0, 120);
    const acc = map.get(endpoint) ?? {
      traffic: 0,
      failures: 0,
      latencySum: 0,
      latencyN: 0,
    };
    acc.failures += 1;
    acc.traffic += 1;
    map.set(endpoint, acc);
  }

  return [...map.entries()]
    .map(([endpoint, acc]) => ({
      endpoint,
      traffic: acc.traffic,
      failures: acc.failures,
      avgLatencyMs:
        acc.latencyN > 0 ? Math.round(acc.latencySum / acc.latencyN) : null,
    }))
    .sort((a, b) => b.traffic - a.traffic)
    .slice(0, 10);
}

async function loadAiOverview(range: DashboardRange): Promise<AiOverviewStats> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - rangeToMs(range)).toISOString();

  const { data, error } = await admin
    .from("ai_usage")
    .select("model, total_tokens, created_at")
    .gte("created_at", since)
    .limit(5000);
  if (error) throw mapPostgrestError(error);

  const rows = data ?? [];
  const byModel = new Map<string, { requests: number; tokens: number }>();
  let tokens = 0;
  for (const row of rows) {
    tokens += row.total_tokens;
    const entry = byModel.get(row.model) ?? { requests: 0, tokens: 0 };
    entry.requests += 1;
    entry.tokens += row.total_tokens;
    byModel.set(row.model, entry);
  }

  // Latency is not stored on ai_usage; leave null rather than inventing values.
  return {
    requestsInRange: rows.length,
    tokensInRange: tokens,
    models: [...byModel.entries()]
      .map(([model, value]) => ({ model, ...value }))
      .sort((a, b) => b.requests - a.requests),
    averageLatencyMs: null,
  };
}

function quickActions(): ExecutiveDashboardData["quickActions"] {
  return [
    {
      id: "create-admin",
      label: "Create Admin",
      description: "Provision a platform administrator",
      href: null,
      enabled: false,
      permission: "admin:settings:write",
    },
    {
      id: "broadcast",
      label: "Broadcast Notification",
      description: "Send a platform-wide notice",
      href: null,
      enabled: false,
      permission: "admin:notifications:read",
    },
    {
      id: "maintenance",
      label: "Maintenance Mode",
      description: "Toggle platform maintenance",
      href: null,
      enabled: false,
      permission: "admin:settings:write",
    },
    {
      id: "generate-key",
      label: "Generate API Key",
      description: "Available in a later admin module",
      href: null,
      enabled: false,
      permission: "admin:api_keys:read",
    },
    {
      id: "monitoring",
      label: "Open Monitoring",
      description: "Platform monitoring center",
      href: ADMIN_ROUTES.monitoring,
      enabled: false,
      permission: "admin:monitoring:read",
    },
    {
      id: "security",
      label: "Open Security Center",
      description: "Security operations",
      href: ADMIN_ROUTES.security,
      enabled: false,
      permission: "admin:security:read",
    },
  ];
}

export function parseDashboardRange(
  value: string | null | undefined,
): DashboardRange {
  if (value === "7d" || value === "30d" || value === "24h") return value;
  return "24h";
}

/**
 * Loads the Enterprise Admin Executive Dashboard.
 * Requires `admin:dashboard`. Uses the service-role client for platform rollups.
 */
export async function getExecutiveDashboard(
  role: AdminPlatformRole,
  range: DashboardRange = "24h",
): Promise<ExecutiveDashboardData> {
  assertAdminPermission(role, "admin:dashboard");

  const [kpis, activity, monitoring, usage, geography, security, incidents, api, ai] =
    await Promise.all([
      loadKpis(),
      loadActivity(),
      loadMonitoring(),
      loadUsage(range),
      loadGeography(),
      loadSecurity(),
      loadIncidents(),
      loadApiOverview(range),
      loadAiOverview(range),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    range,
    kpis,
    activity,
    monitoring,
    usage,
    geography,
    quickActions: quickActions(),
    security,
    incidents,
    api,
    ai,
  };
}
