import "server-only";

import { MONITORING } from "@/lib/constants";
import { formatRelativeTime, truncate } from "@/utils/format";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  BadgeTone,
  Correlation,
  HealthScores,
  Insight,
  IntelligenceSummaries,
  ProjectIntelligence,
  Recommendation,
  SmartBadge,
  TimelineEvent,
  TrendInfo,
  WeeklyReport,
} from "@/services/intelligence/types";

type Supabase = TypedSupabaseClient;

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;
const KEY_ROTATION_MS = 90 * DAY_MS;

// --- Normalized telemetry shapes ------------------------------------------

interface NErr {
  message: string;
  type: string | null;
  level: string;
  url: string | null;
  release: string | null;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
}

interface NInc {
  id: string;
  title: string;
  status: string;
  severity: string;
  startedAt: number;
  resolvedAt: number | null;
  downtimeSeconds: number | null;
}

interface NNotif {
  type: string;
  level: string;
  title: string;
  createdAt: number;
}

interface NConv {
  title: string;
  at: number;
}

interface NKey {
  name: string;
  status: string;
  lastUsedAt: number | null;
  createdAt: number;
}

interface NHeartbeat {
  occurredAt: number;
  release: string | null;
  environment: string | null;
}

interface NPerf {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
  pageLoad: number | null;
  occurredAt: number;
}

// --- Pure helpers ---------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

function ts(value: string | null | undefined): number {
  if (!value) return NaN;
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? NaN : n;
}

function scoreMetric(
  value: number | null,
  good: number,
  ok: number,
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value <= good) return 100;
  if (value <= ok) return 70;
  return 40;
}

const AUTH_RE = /\b(auth|unauthor|forbidden|401|403|token|login|credential|permission|session)\b/i;
const DB_RE = /\b(database|postgres|sql|connection|pool|econn|deadlock|timeout|query|supabase)\b/i;
const NETWORK_RE = /\b(network|fetch|timeout|etimedout|econnreset|socket|502|503|504|gateway|abort)\b/i;

function matches(re: RegExp, err: NErr): boolean {
  return re.test(`${err.message} ${err.type ?? ""} ${err.url ?? ""}`);
}

function sumOccurrences(errors: NErr[]): number {
  return errors.reduce((acc, e) => acc + (e.occurrences || 0), 0);
}

function severityWeight(sev: string): number {
  switch (sev) {
    case "critical":
      return 25;
    case "high":
      return 15;
    case "medium":
      return 8;
    default:
      return 4;
  }
}

const INSIGHT_ORDER: Record<Insight["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

// --- Main engine ----------------------------------------------------------

/**
 * Computes the full autonomous-monitoring intelligence bundle for a project
 * from recorded telemetry. Read-only: no table is mutated.
 */
export async function getProjectIntelligence(
  supabase: Supabase,
  userId: string,
  projectId: string,
): Promise<ProjectIntelligence | null> {
  const now = Date.now();

  const { data: project } = await supabase
    .from("projects")
    .select("name, framework, status, production_url, staging_url")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!project) return null;

  const [
    errorsRes,
    incidentsRes,
    heartbeatRes,
    hb24Res,
    hbPrevRes,
    perfRes,
    notifRes,
    convRes,
    keysRes,
  ] = await Promise.all([
    supabase
      .from("errors")
      .select(
        "message, type, level, url, release, occurrences, first_seen, last_seen",
      )
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("last_seen", { ascending: false })
      .limit(100),
    supabase
      .from("incidents")
      .select(
        "id, title, status, severity, started_at, resolved_at, downtime_seconds",
      )
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(30),
    supabase
      .from("heartbeats")
      .select("occurred_at, release, environment")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("heartbeats")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .gte("occurred_at", new Date(now - DAY_MS).toISOString()),
    supabase
      .from("heartbeats")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .gte("occurred_at", new Date(now - 2 * DAY_MS).toISOString())
      .lt("occurred_at", new Date(now - DAY_MS).toISOString()),
    supabase
      .from("performance_logs")
      .select("lcp, inp, cls, ttfb, fcp, page_load, occurred_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("notification_logs")
      .select("type, level, title, created_at")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("ai_conversations")
      .select("title, last_message_at, updated_at")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("api_keys")
      .select("name, status, last_used_at, created_at")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .limit(50),
  ]);

  // Normalize -------------------------------------------------------------

  const errors: NErr[] = (errorsRes.data ?? []).map((e) => ({
    message: e.message,
    type: e.type,
    level: e.level,
    url: e.url,
    release: e.release,
    occurrences: e.occurrences ?? 1,
    firstSeen: ts(e.first_seen),
    lastSeen: ts(e.last_seen),
  }));

  const incidents: NInc[] = (incidentsRes.data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    severity: i.severity,
    startedAt: ts(i.started_at),
    resolvedAt: i.resolved_at ? ts(i.resolved_at) : null,
    downtimeSeconds: i.downtime_seconds,
  }));

  const notifications: NNotif[] = (notifRes.data ?? []).map((n) => ({
    type: n.type,
    level: n.level,
    title: n.title,
    createdAt: ts(n.created_at),
  }));

  const conversations: NConv[] = (convRes.data ?? []).map((c) => ({
    title: c.title,
    at: ts(c.last_message_at ?? c.updated_at),
  }));

  const keys: NKey[] = (keysRes.data ?? []).map((k) => ({
    name: k.name,
    status: k.status,
    lastUsedAt: k.last_used_at ? ts(k.last_used_at) : null,
    createdAt: ts(k.created_at),
  }));

  const heartbeat: NHeartbeat | null = heartbeatRes.data
    ? {
        occurredAt: ts(heartbeatRes.data.occurred_at),
        release: heartbeatRes.data.release,
        environment: heartbeatRes.data.environment,
      }
    : null;

  const perf: NPerf | null = perfRes.data
    ? {
        lcp: perfRes.data.lcp,
        inp: perfRes.data.inp,
        cls: perfRes.data.cls,
        ttfb: perfRes.data.ttfb,
        fcp: perfRes.data.fcp,
        pageLoad: perfRes.data.page_load,
        occurredAt: ts(perfRes.data.occurred_at),
      }
    : null;

  const hb24 = hb24Res.count ?? 0;
  const hbPrev = hbPrevRes.count ?? 0;

  const hasData =
    errors.length > 0 ||
    incidents.length > 0 ||
    heartbeat !== null ||
    perf !== null ||
    notifications.length > 0;

  // Derived windows -------------------------------------------------------

  const curErrors = errors.filter((e) => e.lastSeen >= now - DAY_MS);
  const prevErrors = errors.filter(
    (e) => e.lastSeen >= now - 2 * DAY_MS && e.lastSeen < now - DAY_MS,
  );
  const curOcc = sumOccurrences(curErrors);
  const prevOcc = sumOccurrences(prevErrors);

  const authCur = curErrors.filter((e) => matches(AUTH_RE, e));
  const dbCur = curErrors.filter((e) => matches(DB_RE, e));
  const dbPrev = prevErrors.filter((e) => matches(DB_RE, e));
  const networkCur = curErrors.filter((e) => matches(NETWORK_RE, e));
  const fatalCur = curErrors.filter(
    (e) => e.level === "fatal" || e.level === "error",
  );

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const hasCriticalIncident = openIncidents.some(
    (i) => i.severity === "critical",
  );
  const resolvedRecently = incidents.filter(
    (i) => i.resolvedAt !== null && i.resolvedAt >= now - DAY_MS,
  );

  const heartbeatAgeMs = heartbeat ? now - heartbeat.occurredAt : Infinity;
  const heartbeatStale =
    heartbeat !== null && heartbeatAgeMs > MONITORING.heartbeatTimeoutMs;

  // Downtime over last 30 days (from incidents).
  let downtime30 = 0;
  for (const inc of incidents) {
    if (inc.startedAt < now - MONTH_MS) continue;
    if (inc.downtimeSeconds && inc.downtimeSeconds > 0) {
      downtime30 += inc.downtimeSeconds * 1000;
    } else {
      const end = inc.resolvedAt ?? now;
      downtime30 += Math.max(0, end - inc.startedAt);
    }
  }

  // Error-rate change (signed %).
  const changePct =
    prevOcc > 0
      ? round(((curOcc - prevOcc) / prevOcc) * 100)
      : curOcc > 0
        ? 100
        : 0;

  // Group current errors by release / url / message.
  const releaseGroups = new Map<string, NErr[]>();
  for (const e of curErrors) {
    if (!e.release) continue;
    const arr = releaseGroups.get(e.release) ?? [];
    arr.push(e);
    releaseGroups.set(e.release, arr);
  }

  const newErrorsByRelease = new Map<string, NErr[]>();
  for (const e of errors) {
    if (!e.release || e.firstSeen < now - DAY_MS) continue;
    const arr = newErrorsByRelease.get(e.release) ?? [];
    arr.push(e);
    newErrorsByRelease.set(e.release, arr);
  }

  const urlOcc = new Map<string, number>();
  for (const e of errors) {
    if (!e.url) continue;
    urlOcc.set(e.url, (urlOcc.get(e.url) ?? 0) + e.occurrences);
  }
  const unstableEndpoint = [...urlOcc.entries()].sort((a, b) => b[1] - a[1])[0];

  const topErrors = [...errors]
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 3);

  // --- Scores ------------------------------------------------------------

  const perfScores = perf
    ? [
        scoreMetric(perf.lcp, 2500, 4000),
        scoreMetric(perf.inp, 200, 500),
        scoreMetric(perf.cls, 0.1, 0.25),
        scoreMetric(perf.ttfb, 800, 1800),
        scoreMetric(perf.fcp, 1800, 3000),
      ].filter((v): v is number => v !== null)
    : [];
  const hasPerf = perfScores.length > 0;
  const performance = hasPerf
    ? round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length)
    : 85;

  let reliability = 100;
  reliability -= Math.min(
    60,
    openIncidents.reduce((acc, i) => acc + severityWeight(i.severity), 0),
  );
  reliability -= Math.min(30, Math.floor(curOcc / 5));
  reliability -= Math.min(20, fatalCur.length * 4);
  reliability = clamp(round(reliability));

  let availability = 100 - (downtime30 / MONTH_MS) * 100;
  if (heartbeatStale) availability = Math.min(availability, 70);
  if (!heartbeat && errors.length === 0 && incidents.length === 0) {
    availability = 100;
  }
  availability = clamp(round(availability));

  let security = 96;
  if (authCur.length > 0) security -= 14;
  if (
    project.production_url &&
    !project.production_url.startsWith("https://")
  ) {
    security -= 10;
  }
  if (keys.some((k) => k.status === "active" && k.createdAt < now - KEY_ROTATION_MS)) {
    security -= 6;
  }
  security = clamp(round(security));

  const distinctSignatures = new Set(
    errors.map((e) => `${e.type ?? ""}:${e.message}`),
  ).size;
  let maintainability = 92;
  maintainability -= Math.min(30, distinctSignatures * 2);
  maintainability -= Math.min(
    18,
    errors.filter((e) => e.occurrences > 50).length * 6,
  );
  maintainability = clamp(round(maintainability));

  const overall = clamp(
    round(
      reliability * 0.28 +
        availability * 0.28 +
        performance * 0.18 +
        security * 0.13 +
        maintainability * 0.13,
    ),
  );

  const scores: HealthScores = {
    overall,
    reliability,
    availability,
    security,
    performance,
    maintainability,
  };

  // --- Trend -------------------------------------------------------------

  let direction: TrendInfo["direction"] = "stable";
  if (heartbeatStale || changePct >= 15) direction = "degrading";
  else if (changePct <= -15) direction = "improving";

  const trend: TrendInfo = {
    direction,
    changePct,
    comparedTo: "previous 24 hours",
    label:
      direction === "improving"
        ? `Error rate down ${Math.abs(changePct)}%`
        : direction === "degrading"
          ? heartbeatStale
            ? "Service liveness degraded"
            : `Error rate up ${changePct}%`
          : "Holding steady",
  };

  // --- Badges ------------------------------------------------------------

  const badges = buildBadges({
    heartbeatStale,
    hasCriticalIncident,
    openCount: openIncidents.length,
    recovered: resolvedRecently.length > 0,
    direction,
    curOcc,
    overall,
  });

  // --- Insights ----------------------------------------------------------

  const insights: Insight[] = [];

  if (Math.abs(changePct) >= 10) {
    if (changePct > 0) {
      insights.push({
        id: "error-rate-up",
        title: `Error rate increased ${changePct}%`,
        detail: `Recorded ${curOcc} error occurrences in the last 24h versus ${prevOcc} in the prior day.`,
        severity: changePct >= 50 ? "critical" : "warning",
        confidence: prevOcc >= 5 ? 82 : 62,
        evidence: [
          `${curOcc} occurrences in last 24h`,
          `${prevOcc} occurrences in prior 24h`,
        ],
      });
    } else {
      insights.push({
        id: "error-rate-down",
        title: `Error rate improved ${Math.abs(changePct)}%`,
        detail: `Error occurrences fell to ${curOcc} in the last 24h from ${prevOcc} the prior day.`,
        severity: "positive",
        confidence: prevOcc >= 5 ? 80 : 60,
        evidence: [
          `${curOcc} occurrences in last 24h`,
          `${prevOcc} occurrences in prior 24h`,
        ],
      });
    }
  } else if (curOcc > 0) {
    insights.push({
      id: "error-rate-stable",
      title: "Error volume is stable",
      detail: `${curOcc} error occurrences in the last 24h, in line with the prior day.`,
      severity: "info",
      confidence: 70,
      evidence: [`${curOcc} vs ${prevOcc} occurrences`],
    });
  }

  if (!heartbeat) {
    insights.push({
      id: "heartbeat-none",
      title: "No heartbeats received yet",
      detail:
        "The SDK has not reported a heartbeat. Verify the SDK is installed and running in production.",
      severity: "warning",
      confidence: 90,
      evidence: ["0 heartbeats recorded"],
    });
  } else if (heartbeatStale) {
    const mins = round(heartbeatAgeMs / 60000);
    insights.push({
      id: "heartbeat-stale",
      title: `No heartbeat received for ${mins} minutes`,
      detail:
        "The service has stopped reporting liveness beacons — this often indicates an outage.",
      severity: "critical",
      confidence: 92,
      evidence: [
        `Last heartbeat ${formatRelativeTime(heartbeat.occurredAt)}`,
        `Timeout threshold ${round(MONITORING.heartbeatTimeoutMs / 60000)}m`,
      ],
    });
  } else {
    insights.push({
      id: "heartbeat-ok",
      title: "Service is live",
      detail: `Heartbeats are arriving normally (last seen ${formatRelativeTime(heartbeat.occurredAt)}).`,
      severity: "positive",
      confidence: 88,
      evidence: [`${hb24} heartbeats in last 24h`],
    });
  }

  if (hbPrev >= 4 && hb24 < hbPrev * 0.5) {
    insights.push({
      id: "sdk-inactivity",
      title: "Unexpected drop in SDK activity",
      detail: `Heartbeat volume fell from ${hbPrev} to ${hb24} between the prior and current day.`,
      severity: "warning",
      confidence: 70,
      evidence: [`${hbPrev} → ${hb24} heartbeats/day`],
    });
  }

  if (openIncidents.length > 0) {
    const worst = openIncidents.reduce((a, b) =>
      severityWeight(b.severity) > severityWeight(a.severity) ? b : a,
    );
    insights.push({
      id: "open-incidents",
      title: `${openIncidents.length} open incident${openIncidents.length > 1 ? "s" : ""}`,
      detail: `Highest severity is ${worst.severity}: "${worst.title}".`,
      severity: hasCriticalIncident ? "critical" : "warning",
      confidence: 95,
      evidence: openIncidents
        .slice(0, 3)
        .map((i) => `[${i.severity}/${i.status}] ${i.title}`),
    });
  }

  if (resolvedRecently.length > 0 && openIncidents.length === 0) {
    insights.push({
      id: "recovered",
      title: "Service recovered",
      detail: `${resolvedRecently.length} incident${resolvedRecently.length > 1 ? "s" : ""} resolved in the last 24h with no open incidents remaining.`,
      severity: "positive",
      confidence: 85,
      evidence: resolvedRecently.slice(0, 2).map((i) => `Resolved: ${i.title}`),
    });
  }

  const deploymentRelease = [...newErrorsByRelease.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => sumOccurrences(b[1]) - sumOccurrences(a[1]))[0];
  if (deploymentRelease) {
    const [release, group] = deploymentRelease;
    insights.push({
      id: "deployment-failures",
      title: `Deployment ${release} introduced new failures`,
      detail: `${group.length} new error signatures first appeared under release ${release} within the last 24h.`,
      severity: "warning",
      confidence: 66,
      evidence: [
        `${group.length} new signatures on ${release}`,
        `${sumOccurrences(group)} occurrences`,
      ],
    });
  }

  if (authCur.length > 0) {
    insights.push({
      id: "auth-failures",
      title: "Authentication failures detected",
      detail: `${sumOccurrences(authCur)} authentication-related error occurrences in the last 24h.`,
      severity: "warning",
      confidence: 60,
      evidence: authCur.slice(0, 2).map((e) => truncate(e.message, 70)),
    });
  }

  if (dbCur.length > 0) {
    insights.push({
      id: "db-instability",
      title: "Database instability detected",
      detail: `${sumOccurrences(dbCur)} database/connection-related occurrences in the last 24h.`,
      severity: "warning",
      confidence: 55,
      evidence: dbCur.slice(0, 2).map((e) => truncate(e.message, 70)),
    });
  } else if (dbPrev.length > 0) {
    insights.push({
      id: "db-recovered",
      title: "Database recovered successfully",
      detail:
        "Database-related errors were present in the prior day but none in the last 24h.",
      severity: "positive",
      confidence: 60,
      evidence: [`${sumOccurrences(dbPrev)} occurrences the prior day`],
    });
  }

  if (hasPerf && perf) {
    const slow =
      (perf.lcp !== null && perf.lcp > 4000) ||
      (perf.ttfb !== null && perf.ttfb > 1800);
    if (slow) {
      insights.push({
        id: "perf-slow",
        title: "Slow response times detected",
        detail:
          "The latest performance sample exceeds recommended thresholds for load performance.",
        severity: "warning",
        confidence: 70,
        evidence: [
          perf.lcp !== null ? `LCP ${round(perf.lcp)}ms` : "LCP n/a",
          perf.ttfb !== null ? `TTFB ${round(perf.ttfb)}ms` : "TTFB n/a",
        ],
      });
    } else {
      insights.push({
        id: "perf-ok",
        title: "Performance within healthy thresholds",
        detail: "The latest performance sample is within recommended bounds.",
        severity: "positive",
        confidence: 74,
        evidence: [
          perf.lcp !== null ? `LCP ${round(perf.lcp)}ms` : "LCP n/a",
          `Performance score ${performance}`,
        ],
      });
    }
  }

  insights.sort(
    (a, b) =>
      INSIGHT_ORDER[a.severity] - INSIGHT_ORDER[b.severity] ||
      b.confidence - a.confidence,
  );

  // --- Recommendations ---------------------------------------------------

  const recommendations: Recommendation[] = [];

  if (deploymentRelease) {
    recommendations.push({
      id: "rec-deploy",
      title: `Investigate deployment ${deploymentRelease[0]}`,
      detail:
        "New error signatures cluster around this release. Review the diff or consider a rollback.",
      priority: "high",
      confidence: 66,
      reasoning:
        "New error fingerprints first appeared under this release within 24h of it being observed.",
      evidence: [
        `${deploymentRelease[1].length} new signatures`,
        `${sumOccurrences(deploymentRelease[1])} occurrences`,
      ],
    });
  }

  if (heartbeatStale) {
    recommendations.push({
      id: "rec-availability",
      title: "Restore service availability",
      detail:
        "The service has stopped emitting heartbeats. Check hosting status, health checks and recent deploys.",
      priority: "high",
      confidence: 85,
      reasoning: `No heartbeat for ${round(heartbeatAgeMs / 60000)} minutes exceeds the ${round(MONITORING.heartbeatTimeoutMs / 60000)}m outage threshold.`,
      evidence: [`Last heartbeat ${formatRelativeTime(heartbeat!.occurredAt)}`],
    });
  }

  if (authCur.length > 0) {
    recommendations.push({
      id: "rec-auth",
      title: "Review authentication flow",
      detail:
        "Authentication-related errors are occurring. Verify token handling, session expiry and credential validation.",
      priority: "high",
      confidence: 58,
      reasoning:
        "Recent error messages match authentication and authorization patterns.",
      evidence: [`${sumOccurrences(authCur)} auth-related occurrences (24h)`],
    });
  }

  if (dbCur.length > 0) {
    recommendations.push({
      id: "rec-db",
      title: "Optimize database queries and connections",
      detail:
        "Database or connection errors suggest slow queries or pool exhaustion. Add indexes, tune pool size, and set timeouts.",
      priority: "high",
      confidence: 55,
      reasoning:
        "Recent errors match database/connection patterns (timeouts, pool, connection resets).",
      evidence: [`${sumOccurrences(dbCur)} database-related occurrences (24h)`],
    });
  }

  if (networkCur.length > 0) {
    recommendations.push({
      id: "rec-network",
      title: "Reduce retry attempts and add backoff",
      detail:
        "Network/gateway failures are present. Add exponential backoff and circuit breaking to avoid retry storms.",
      priority: "medium",
      confidence: 52,
      reasoning: "Recent errors match network/gateway failure patterns.",
      evidence: [`${sumOccurrences(networkCur)} network-related occurrences (24h)`],
    });
  }

  if (hasPerf && perf && ((perf.lcp ?? 0) > 4000 || (perf.ttfb ?? 0) > 1800)) {
    recommendations.push({
      id: "rec-cache",
      title: "Enable caching and optimize slow endpoints",
      detail:
        "Load metrics exceed recommended thresholds. Add caching, CDN and payload/query optimizations.",
      priority: "medium",
      confidence: 64,
      reasoning: "The latest performance sample exceeds LCP/TTFB thresholds.",
      evidence: [
        perf.lcp !== null ? `LCP ${round(perf.lcp)}ms` : "LCP n/a",
        perf.ttfb !== null ? `TTFB ${round(perf.ttfb)}ms` : "TTFB n/a",
      ],
    });
  }

  const neverUsedKey = keys.find(
    (k) => k.status === "active" && k.lastUsedAt === null,
  );
  if (neverUsedKey) {
    recommendations.push({
      id: "rec-key-unused",
      title: "Remove or activate an unused API key",
      detail: `The key "${neverUsedKey.name}" is active but has never been used. Remove it to reduce attack surface, or wire it into your SDK.`,
      priority: "low",
      confidence: 80,
      reasoning: "An active API key has a null last-used timestamp.",
      evidence: [`Key "${neverUsedKey.name}" never used`],
    });
  }

  const oldKey = keys.find(
    (k) => k.status === "active" && k.createdAt < now - KEY_ROTATION_MS,
  );
  if (oldKey) {
    recommendations.push({
      id: "rec-key-rotate",
      title: "Rotate an aging API key",
      detail: `The key "${oldKey.name}" is over 90 days old. Rotate it to follow key-hygiene best practices.`,
      priority: "low",
      confidence: 70,
      reasoning: "An active API key was created more than 90 days ago.",
      evidence: [`Key "${oldKey.name}" created ${formatRelativeTime(oldKey.createdAt)}`],
    });
  }

  const topErr = topErrors[0];
  if (topErr && topErr.occurrences > 20) {
    recommendations.push({
      id: "rec-top-error",
      title: "Fix the top recurring error",
      detail: `"${truncate(topErr.message, 80)}" accounts for ${topErr.occurrences} occurrences. Prioritize a root-cause fix.`,
      priority: "medium",
      confidence: 75,
      reasoning: "A single error signature dominates total occurrences.",
      evidence: [`${topErr.occurrences} occurrences`, truncate(topErr.message, 70)],
    });
  }

  const priorityOrder: Record<Recommendation["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  recommendations.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      b.confidence - a.confidence,
  );

  // --- Correlations ------------------------------------------------------

  const correlations = buildCorrelations({
    now,
    newErrorsByRelease,
    incidents,
    heartbeat,
    heartbeatStale,
    openIncidents,
    changePct,
  });

  // --- Timeline ----------------------------------------------------------

  const timeline = buildTimeline({
    errors,
    incidents,
    heartbeat,
    heartbeatStale,
    perf,
    notifications,
    conversations,
    releaseGroups,
    now,
  });

  // --- Summaries ---------------------------------------------------------

  const summaries = buildSummaries({
    projectName: project.name,
    scores,
    trend,
    changePct,
    curOcc,
    prevOcc,
    openIncidents,
    resolvedRecently,
    heartbeatStale,
    availability,
    topErrors,
    unstableEndpoint,
    productionUrl: project.production_url,
    hasPerf,
    performance,
    recommendations,
    insights,
  });

  return {
    projectId,
    projectName: project.name,
    framework: project.framework,
    status: project.status,
    generatedAt: new Date(now).toISOString(),
    hasData,
    scores,
    trend,
    badges,
    insights,
    recommendations,
    correlations,
    timeline,
    summaries,
  };
}

// --- Sub-builders ---------------------------------------------------------

function buildBadges(input: {
  heartbeatStale: boolean;
  hasCriticalIncident: boolean;
  openCount: number;
  recovered: boolean;
  direction: TrendInfo["direction"];
  curOcc: number;
  overall: number;
}): SmartBadge[] {
  const out: SmartBadge[] = [];
  const seen = new Set<string>();
  const push = (label: string, tone: BadgeTone) => {
    if (seen.has(label)) return;
    seen.add(label);
    out.push({ label, tone });
  };

  if (input.heartbeatStale || input.hasCriticalIncident) {
    push("Critical", "danger");
  } else if (input.openCount > 0) {
    push("Investigating", "warning");
  }

  if (input.recovered && input.openCount === 0) push("Recovered", "success");
  if (input.direction === "improving") push("Improving", "primary");

  if (
    !input.heartbeatStale &&
    !input.hasCriticalIncident &&
    input.openCount === 0 &&
    input.curOcc === 0
  ) {
    push("Healthy", "success");
  }

  if (input.direction === "stable" && input.overall >= 80) {
    push("Stable", "default");
  }

  if (out.length === 0) {
    if (input.overall >= 85) push("Healthy", "success");
    else if (input.overall >= 70) push("Needs Attention", "warning");
    else push("Needs Attention", "warning");
  }

  return out;
}

function buildCorrelations(input: {
  now: number;
  newErrorsByRelease: Map<string, NErr[]>;
  incidents: NInc[];
  heartbeat: NHeartbeat | null;
  heartbeatStale: boolean;
  openIncidents: NInc[];
  changePct: number;
}): Correlation[] {
  const out: Correlation[] = [];

  const topRelease = [...input.newErrorsByRelease.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => sumOccurrences(b[1]) - sumOccurrences(a[1]))[0];

  if (topRelease) {
    const [release, group] = topRelease;
    const earliest = Math.min(...group.map((e) => e.firstSeen));
    const nearIncident = input.incidents.find(
      (i) => Math.abs(i.startedAt - earliest) <= 6 * 60 * 60 * 1000,
    );
    const events: Correlation["events"] = [
      { at: new Date(earliest).toISOString(), label: `Release ${release} errors began` },
      ...group
        .slice(0, 3)
        .map((e) => ({
          at: new Date(e.firstSeen).toISOString(),
          label: truncate(e.message, 60),
        })),
    ];
    if (nearIncident) {
      events.push({
        at: new Date(nearIncident.startedAt).toISOString(),
        label: `Incident: ${nearIncident.title}`,
      });
    }
    events.sort((a, b) => ts(a.at) - ts(b.at));
    out.push({
      id: "corr-deploy",
      title: `Errors correlated with deployment ${release}`,
      relationship: nearIncident
        ? "A cluster of new errors and an incident both appear shortly after this release."
        : "A cluster of new error signatures appears shortly after this release.",
      rootEvent: `Deployment ${release}`,
      confidence: Math.min(90, 45 + group.length * 8 + (nearIncident ? 10 : 0)),
      events,
    });
  }

  if (input.heartbeatStale && input.heartbeat && input.openIncidents.length > 0) {
    const inc = input.openIncidents[0]!;
    out.push({
      id: "corr-heartbeat",
      title: "Heartbeat interruption correlates with an active incident",
      relationship:
        "The service stopped emitting heartbeats around the time an incident was opened.",
      rootEvent: "Heartbeat interruption",
      confidence: 75,
      events: [
        {
          at: new Date(input.heartbeat.occurredAt).toISOString(),
          label: "Last heartbeat received",
        },
        {
          at: new Date(inc.startedAt).toISOString(),
          label: `Incident opened: ${inc.title}`,
        },
      ].sort((a, b) => ts(a.at) - ts(b.at)),
    });
  }

  if (input.changePct >= 25 && input.openIncidents.length > 0 && out.length < 3) {
    const inc = input.openIncidents[0]!;
    out.push({
      id: "corr-spike",
      title: "Error spike aligns with an incident window",
      relationship:
        "A sharp rise in error volume coincides with an open incident.",
      rootEvent: "Error spike",
      confidence: 68,
      events: [
        {
          at: new Date(inc.startedAt).toISOString(),
          label: `Incident opened: ${inc.title}`,
        },
        {
          at: new Date(input.now).toISOString(),
          label: `Error rate up ${input.changePct}%`,
        },
      ],
    });
  }

  return out.slice(0, 3);
}

function levelToTone(level: string): BadgeTone {
  switch (level) {
    case "fatal":
    case "error":
      return "danger";
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "info":
      return "primary";
    default:
      return "default";
  }
}

function severityToTone(sev: string): BadgeTone {
  switch (sev) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    default:
      return "default";
  }
}

function buildTimeline(input: {
  errors: NErr[];
  incidents: NInc[];
  heartbeat: NHeartbeat | null;
  heartbeatStale: boolean;
  perf: NPerf | null;
  notifications: NNotif[];
  conversations: NConv[];
  releaseGroups: Map<string, NErr[]>;
  now: number;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Deployments: earliest observation per release.
  const releaseFirst = new Map<string, number>();
  for (const e of input.errors) {
    if (!e.release) continue;
    const cur = releaseFirst.get(e.release);
    if (cur === undefined || e.firstSeen < cur) {
      releaseFirst.set(e.release, e.firstSeen);
    }
  }
  [...releaseFirst.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([release, at]) => {
      events.push({
        id: `deploy-${release}`,
        kind: "deployment",
        title: `Release ${release}`,
        detail: "First observed in telemetry",
        at: new Date(at).toISOString(),
        tone: "primary",
      });
    });

  input.errors.slice(0, 12).forEach((e, idx) => {
    events.push({
      id: `err-${idx}-${e.lastSeen}`,
      kind: "error",
      title: truncate(e.message, 80),
      detail: `${e.occurrences}× · ${e.type ?? "error"}${e.release ? ` · ${e.release}` : ""}`,
      at: new Date(e.lastSeen).toISOString(),
      tone: levelToTone(e.level),
    });
  });

  input.incidents.forEach((i) => {
    events.push({
      id: `inc-start-${i.id}`,
      kind: "incident",
      title: `Incident opened: ${i.title}`,
      detail: `${i.severity} severity`,
      at: new Date(i.startedAt).toISOString(),
      tone: severityToTone(i.severity),
    });
    if (i.resolvedAt !== null) {
      events.push({
        id: `inc-end-${i.id}`,
        kind: "incident",
        title: `Incident resolved: ${i.title}`,
        detail: "Recovered",
        at: new Date(i.resolvedAt).toISOString(),
        tone: "success",
      });
    }
  });

  if (input.heartbeat) {
    events.push({
      id: "hb-latest",
      kind: "heartbeat",
      title: input.heartbeatStale ? "Heartbeat stale" : "Heartbeat received",
      detail: input.heartbeat.release
        ? `Release ${input.heartbeat.release}`
        : undefined,
      at: new Date(input.heartbeat.occurredAt).toISOString(),
      tone: input.heartbeatStale ? "danger" : "success",
    });
  }

  if (input.perf) {
    events.push({
      id: "perf-latest",
      kind: "performance",
      title: "Performance sample",
      detail:
        input.perf.lcp !== null ? `LCP ${Math.round(input.perf.lcp)}ms` : undefined,
      at: new Date(input.perf.occurredAt).toISOString(),
      tone: "primary",
    });
  }

  input.notifications.forEach((n, idx) => {
    events.push({
      id: `notif-${idx}-${n.createdAt}`,
      kind: "notification",
      title: n.title,
      detail: "Notification",
      at: new Date(n.createdAt).toISOString(),
      tone: levelToTone(n.level),
    });
  });

  input.conversations.forEach((c, idx) => {
    if (Number.isNaN(c.at)) return;
    events.push({
      id: `ai-${idx}-${c.at}`,
      kind: "ai",
      title: `AI analysis: ${c.title}`,
      detail: "Assistant conversation",
      at: new Date(c.at).toISOString(),
      tone: "primary",
    });
  });

  return events
    .filter((e) => !Number.isNaN(ts(e.at)))
    .sort((a, b) => ts(b.at) - ts(a.at))
    .slice(0, 40);
}

function riskLevel(overall: number): "low" | "medium" | "high" {
  if (overall >= 85) return "low";
  if (overall >= 70) return "medium";
  return "high";
}

function statusWord(overall: number): string {
  if (overall >= 85) return "healthy";
  if (overall >= 70) return "mostly stable but needs attention";
  return "at risk";
}

function buildSummaries(input: {
  projectName: string;
  scores: HealthScores;
  trend: TrendInfo;
  changePct: number;
  curOcc: number;
  prevOcc: number;
  openIncidents: NInc[];
  resolvedRecently: NInc[];
  heartbeatStale: boolean;
  availability: number;
  topErrors: NErr[];
  unstableEndpoint: [string, number] | undefined;
  productionUrl: string | null;
  hasPerf: boolean;
  performance: number;
  recommendations: Recommendation[];
  insights: Insight[];
}): IntelligenceSummaries {
  const risk = riskLevel(input.scores.overall);
  const status = statusWord(input.scores.overall);

  const availabilityLine = input.heartbeatStale
    ? "The service is currently not reporting as live, which may mean it is down."
    : `Availability is around ${input.availability}% based on recorded downtime.`;

  const trendLine =
    input.changePct === 0
      ? "Error levels are steady compared with the previous day."
      : input.changePct < 0
        ? `Errors are down ${Math.abs(input.changePct)}% versus the previous day.`
        : `Errors are up ${input.changePct}% versus the previous day.`;

  const executive = [
    `Overall, ${input.projectName} is ${status} (health score ${input.scores.overall}/100).`,
    trendLine,
    availabilityLine,
    input.openIncidents.length > 0
      ? `There ${input.openIncidents.length === 1 ? "is" : "are"} ${input.openIncidents.length} open incident${input.openIncidents.length === 1 ? "" : "s"} being worked on.`
      : "There are no open incidents right now.",
    `Business impact: ${risk === "low" ? "minimal" : risk === "medium" ? "moderate" : "significant"}. Overall risk level: ${risk}.`,
  ].join(" ");

  const affectedServices = new Set<string>();
  if (input.productionUrl) affectedServices.add(input.productionUrl);
  for (const e of input.topErrors) if (e.url) affectedServices.add(e.url);

  const developerLines: string[] = [];
  developerLines.push(`## Developer summary — ${input.projectName}`);
  developerLines.push(
    `Health: overall ${input.scores.overall}, reliability ${input.scores.reliability}, availability ${input.scores.availability}, performance ${input.scores.performance}, security ${input.scores.security}, maintainability ${input.scores.maintainability}.`,
  );
  developerLines.push("");
  developerLines.push("### Likely root causes");
  if (input.topErrors.length > 0) {
    for (const e of input.topErrors) {
      developerLines.push(
        `- ${truncate(e.message, 90)} — ${e.occurrences}× (${e.type ?? "error"}${e.release ? `, ${e.release}` : ""})`,
      );
    }
  } else {
    developerLines.push("- No recurring errors recorded.");
  }
  developerLines.push("");
  developerLines.push("### Affected services / endpoints");
  developerLines.push(
    affectedServices.size > 0
      ? [...affectedServices].slice(0, 5).map((s) => `- ${s}`).join("\n")
      : "- No specific endpoints identified.",
  );
  developerLines.push("");
  developerLines.push(
    "> Stack traces for each error group are available on the Error Monitoring page.",
  );
  developerLines.push("");
  developerLines.push("### Recommendations");
  developerLines.push(
    input.recommendations.length > 0
      ? input.recommendations
          .slice(0, 5)
          .map((r) => `- **${r.title}** (${r.confidence}% confidence) — ${r.detail}`)
          .join("\n")
      : "- No action required at this time.",
  );
  const developer = developerLines.join("\n");

  const highestRiskInsight = input.insights.find(
    (i) => i.severity === "critical",
  );
  const weekly: WeeklyReport = {
    summary: `${input.projectName} scored ${input.scores.overall}/100 this period. ${trendLine} ${availabilityLine}`,
    mostCommonErrors:
      input.topErrors.length > 0
        ? input.topErrors.map((e) => `${truncate(e.message, 80)} (${e.occurrences}×)`)
        : ["No errors recorded."],
    mostUnstableEndpoint: input.unstableEndpoint
      ? `${input.unstableEndpoint[0]} (${input.unstableEndpoint[1]} occurrences)`
      : "None identified.",
    bestPerformingService: input.hasPerf
      ? `${input.productionUrl ?? "Primary service"} — performance score ${input.performance}`
      : input.productionUrl ?? "Primary service",
    biggestImprovement:
      input.changePct < 0
        ? `Error rate down ${Math.abs(input.changePct)}% vs the previous day.`
        : input.resolvedRecently.length > 0
          ? `${input.resolvedRecently.length} incident(s) resolved.`
          : "No notable improvement this period.",
    highestRisk: highestRiskInsight
      ? highestRiskInsight.title
      : input.openIncidents.length > 0
        ? `Open incident: ${input.openIncidents[0]!.title}`
        : risk === "low"
          ? "Low — no significant risks detected."
          : "Elevated error activity.",
    recommendations:
      input.recommendations.length > 0
        ? input.recommendations.slice(0, 5).map((r) => r.title)
        : ["No action required at this time."],
  };

  return { executive, developer, weekly };
}
