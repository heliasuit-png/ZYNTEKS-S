import "server-only";

import { MONITORING } from "@/lib/constants";
import { uptimePercent } from "@/services/status/uptime";
import type { DowntimeInterval } from "@/services/status/uptime";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { ApiKeyEnvironment, Json } from "@/types/database";
import type { HealthState } from "@/types/dashboard";
import {
  avg,
  clamp,
  percentile,
  round,
  scoreMetric,
  severityWeight,
  toMb,
} from "@/services/health/math";
import type {
  HealthDashboard,
  HealthScoreBreakdown,
  HealthStatus,
  HealthTimelineEvent,
  HealthTrend,
  HeartbeatStats,
  LatencyStats,
  PerformanceVitals,
  ProjectHealthRow,
  UptimeWindows,
} from "@/features/health/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPECTED_HEARTBEAT_SEC = 60;

export interface HealthFilterParams {
  projectId?: string;
  environment?: ApiKeyEnvironment;
  status?: HealthStatus;
  from?: string;
  to?: string;
  search?: string;
}

interface IncidentRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  downtime_seconds: number | null;
}

function jsonRecord(value: Json | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function downtimeIntervals(
  incidents: IncidentRow[],
  now: number,
): DowntimeInterval[] {
  return incidents.map((inc) => {
    const start = new Date(inc.started_at).getTime();
    if (inc.resolved_at) {
      return { start, end: new Date(inc.resolved_at).getTime() };
    }
    if (inc.downtime_seconds != null && inc.downtime_seconds > 0) {
      return { start, end: start + inc.downtime_seconds * 1000 };
    }
    return { start, end: now };
  });
}

function computeUptime(
  intervals: DowntimeInterval[],
  now: number,
): UptimeWindows {
  return {
    h24: uptimePercent(intervals, now - DAY_MS, now),
    d7: uptimePercent(intervals, now - 7 * DAY_MS, now),
    d30: uptimePercent(intervals, now - 30 * DAY_MS, now),
    d90: uptimePercent(intervals, now - 90 * DAY_MS, now),
    current: uptimePercent(intervals, now - DAY_MS, now),
  };
}

function analyzeHeartbeats(
  occurredAts: string[],
  now: number,
): HeartbeatStats {
  const sorted = [...occurredAts]
    .map((at) => new Date(at).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  const history = sorted.map((t) => new Date(t).toISOString());
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    intervals.push((sorted[i]! - sorted[i - 1]!) / 1000);
  }

  const averageIntervalSec = avg(intervals);
  const lastAt = history.length > 0 ? history[history.length - 1]! : null;
  const lastMs = lastAt ? new Date(lastAt).getTime() : NaN;
  const stale =
    !lastAt || now - lastMs > MONITORING.heartbeatTimeoutMs;

  // Missing beats: gaps longer than 2.5× expected interval.
  const missingThreshold = EXPECTED_HEARTBEAT_SEC * 2.5;
  let missingCount = 0;
  for (const gap of intervals) {
    if (gap > missingThreshold) {
      missingCount += Math.floor(gap / EXPECTED_HEARTBEAT_SEC) - 1;
    }
  }
  if (stale && lastAt) {
    missingCount += Math.max(
      0,
      Math.floor((now - lastMs) / 1000 / EXPECTED_HEARTBEAT_SEC) - 1,
    );
  }

  let consistencyScore = 100;
  if (sorted.length === 0) {
    consistencyScore = 100; // no telemetry yet — neutral
  } else {
    if (stale) consistencyScore -= 45;
    consistencyScore -= Math.min(40, missingCount * 2);
    if (averageIntervalSec != null) {
      const drift = Math.abs(averageIntervalSec - EXPECTED_HEARTBEAT_SEC);
      consistencyScore -= Math.min(25, Math.floor(drift / 10));
    }
  }

  return {
    lastAt,
    count: sorted.length,
    averageIntervalSec:
      averageIntervalSec != null ? round(averageIntervalSec * 10) / 10 : null,
    expectedIntervalSec: EXPECTED_HEARTBEAT_SEC,
    missingCount,
    consistencyScore: clamp(round(consistencyScore)),
    stale: sorted.length > 0 && stale,
    history,
    intervals: intervals.map((v) => round(v * 10) / 10),
  };
}

function analyzeLatency(
  ttfbValues: number[],
  pageLoadValues: number[],
): LatencyStats {
  const ttfb = [...ttfbValues].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const pageLoad = [...pageLoadValues].filter((v) => Number.isFinite(v));
  return {
    average: avg(ttfb) != null ? round(avg(ttfb)!) : null,
    min: ttfb.length ? ttfb[0]! : null,
    max: ttfb.length ? ttfb[ttfb.length - 1]! : null,
    p95: percentile(ttfb, 95) != null ? round(percentile(ttfb, 95)!) : null,
    p99: percentile(ttfb, 99) != null ? round(percentile(ttfb, 99)!) : null,
    sampleCount: ttfb.length,
    series: ttfbValues.filter((v) => Number.isFinite(v)).slice(-48),
    responseSeries: pageLoad.slice(-48),
  };
}

function deriveStatus(input: {
  overall: number;
  heartbeatStale: boolean;
  openCritical: boolean;
  investigating: boolean;
  recoveredRecently: boolean;
}): HealthStatus {
  if (input.investigating) return "investigating";
  if (input.openCritical || input.heartbeatStale || input.overall < 70) {
    return "critical";
  }
  if (input.overall < 90) return "warning";
  if (input.recoveredRecently) return "recovered";
  return "healthy";
}

function statusToState(status: HealthStatus): HealthState {
  if (status === "critical") return "down";
  if (status === "warning" || status === "investigating") return "degraded";
  return "operational";
}

function computeScores(input: {
  openIncidents: IncidentRow[];
  errorOccurrences: number;
  fatalErrorGroups: number;
  uptime30: number;
  heartbeat: HeartbeatStats;
  latency: LatencyStats;
  performance: PerformanceVitals;
  meanRecoverySec: number | null;
}): HealthScoreBreakdown {
  const {
    openIncidents,
    errorOccurrences,
    fatalErrorGroups,
    uptime30,
    heartbeat,
    latency,
    performance,
    meanRecoverySec,
  } = input;

  let reliability = 100;
  reliability -= Math.min(
    60,
    openIncidents.reduce((acc, i) => acc + severityWeight(i.severity), 0),
  );
  reliability -= Math.min(30, Math.floor(errorOccurrences / 5));
  reliability -= Math.min(20, fatalErrorGroups * 4);
  reliability = clamp(round(reliability));

  let availability = uptime30;
  if (heartbeat.stale) availability = Math.min(availability, 70);
  if (heartbeat.count === 0 && errorOccurrences === 0 && openIncidents.length === 0) {
    availability = 100;
  }
  availability = clamp(round(availability));

  const vitals = [
    scoreMetric(performance.lcp, 2500, 4000),
    scoreMetric(performance.inp, 200, 500),
    scoreMetric(performance.cls, 0.1, 0.25),
    scoreMetric(performance.ttfb, 800, 1800),
    scoreMetric(performance.fcp, 1800, 3000),
  ].filter((v): v is number => v !== null);
  const performanceScore =
    vitals.length > 0
      ? round(vitals.reduce((a, b) => a + b, 0) / vitals.length)
      : 85;

  const latencyScore =
    scoreMetric(latency.p95 ?? latency.average, 800, 1800) ?? 85;

  let errorRateScore = 100;
  errorRateScore -= Math.min(50, Math.floor(errorOccurrences / 3));
  errorRateScore -= Math.min(30, fatalErrorGroups * 5);
  errorRateScore = clamp(round(errorRateScore));

  let recoveryScore = 90;
  if (meanRecoverySec != null) {
    if (meanRecoverySec <= 5 * 60) recoveryScore = 100;
    else if (meanRecoverySec <= 30 * 60) recoveryScore = 85;
    else if (meanRecoverySec <= 2 * 60 * 60) recoveryScore = 70;
    else recoveryScore = 50;
  }

  const heartbeatScore = heartbeat.consistencyScore;

  const overall = clamp(
    round(
      heartbeatScore * 0.15 +
        reliability * 0.18 +
        errorRateScore * 0.12 +
        availability * 0.2 +
        performanceScore * 0.15 +
        latencyScore * 0.1 +
        recoveryScore * 0.1,
    ),
  );

  return {
    overall,
    reliability,
    performance: performanceScore,
    availability,
    heartbeat: heartbeatScore,
    errorRate: errorRateScore,
    latency: latencyScore,
    recovery: recoveryScore,
  };
}

function buildTimeline(input: {
  heartbeats: { occurred_at: string; release: string | null }[];
  errors: { id: string; message: string; last_seen: string; level: string }[];
  incidents: IncidentRow[];
  perf: { occurred_at: string; lcp: number | null; page_load: number | null }[];
}): HealthTimelineEvent[] {
  const events: HealthTimelineEvent[] = [];

  const recentHb = input.heartbeats.slice(-5);
  for (const hb of recentHb) {
    events.push({
      id: `hb-${hb.occurred_at}`,
      at: hb.occurred_at,
      title: "Heartbeat received",
      detail: hb.release ? `Release ${hb.release}` : undefined,
      kind: "heartbeat",
      tone: "success",
    });
  }

  for (const err of input.errors.slice(0, 8)) {
    events.push({
      id: `err-${err.id}`,
      at: err.last_seen,
      title: `Error: ${err.message}`,
      detail: err.level,
      kind: "error",
      tone: err.level === "fatal" || err.level === "error" ? "danger" : "warning",
    });
  }

  for (const inc of input.incidents.slice(0, 8)) {
    events.push({
      id: `inc-open-${inc.id}`,
      at: inc.started_at,
      title: `Incident opened: ${inc.title}`,
      detail: `${inc.severity} · ${inc.status}`,
      kind: "incident",
      tone: "danger",
    });
    if (inc.resolved_at) {
      events.push({
        id: `inc-res-${inc.id}`,
        at: inc.resolved_at,
        title: `Recovered: ${inc.title}`,
        kind: "recovery",
        tone: "success",
      });
    }
  }

  for (const p of input.perf.slice(-5)) {
    events.push({
      id: `perf-${p.occurred_at}`,
      at: p.occurred_at,
      title: "Performance sample",
      detail: [
        p.lcp != null ? `LCP ${Math.round(p.lcp)}ms` : null,
        p.page_load != null ? `Load ${Math.round(p.page_load)}ms` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      kind: "performance",
      tone: "primary",
    });
  }

  // Deployment signals: unique release transitions on heartbeats.
  const releases = input.heartbeats
    .filter((h) => h.release)
    .map((h) => ({ at: h.occurred_at, release: h.release! }));
  let prevRelease: string | null = null;
  for (const r of releases) {
    if (prevRelease && r.release !== prevRelease) {
      events.push({
        id: `deploy-${r.at}-${r.release}`,
        at: r.at,
        title: `Deployment detected: ${r.release}`,
        detail: `Previous ${prevRelease}`,
        kind: "deployment",
        tone: "primary",
      });
    }
    prevRelease = r.release;
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

/** Computes full health dashboard for the authenticated user's workspace. */
export async function buildHealthDashboard(
  supabase: TypedSupabaseClient,
  userId: string,
  params: HealthFilterParams = {},
): Promise<HealthDashboard> {
  const now = Date.now();
  const windowStart = params.from
    ? new Date(params.from).getTime()
    : now - 7 * DAY_MS;
  const windowEnd = params.to ? new Date(params.to).getTime() : now;
  const fromIso = new Date(windowStart).toISOString();
  const toIso = new Date(windowEnd).toISOString();
  const prevStart = windowStart - (windowEnd - windowStart);
  const prevFromIso = new Date(prevStart).toISOString();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("user_id", userId)
    .order("name", { ascending: true })
    .limit(100);

  const allProjects = projects ?? [];
  let selectedProjectId =
    params.projectId && allProjects.some((p) => p.id === params.projectId)
      ? params.projectId
      : allProjects[0]?.id ?? null;

  const empty: HealthDashboard = {
    score: {
      overall: 100,
      reliability: 100,
      performance: 100,
      availability: 100,
      heartbeat: 100,
      errorRate: 100,
      latency: 100,
      recovery: 100,
    },
    status: "healthy",
    state: "operational",
    trend: {
      direction: "stable",
      changePct: 0,
      label: "No change vs previous window",
      previousOverall: 100,
    },
    uptime: { h24: 100, d7: 100, d30: 100, d90: 100, current: 100 },
    heartbeat: {
      lastAt: null,
      count: 0,
      averageIntervalSec: null,
      expectedIntervalSec: EXPECTED_HEARTBEAT_SEC,
      missingCount: 0,
      consistencyScore: 100,
      stale: false,
      history: [],
      intervals: [],
    },
    latency: {
      average: null,
      min: null,
      max: null,
      p95: null,
      p99: null,
      sampleCount: 0,
      series: [],
      responseSeries: [],
    },
    performance: {
      fcp: null,
      lcp: null,
      cls: null,
      inp: null,
      ttfb: null,
      pageLoad: null,
      navigation: null,
      memoryUsedMb: null,
      memoryTotalMb: null,
      sampleCount: 0,
    },
    timeline: [],
    projects: [],
    selectedProjectId: null,
    hasTelemetry: false,
  };

  if (allProjects.length === 0 || !selectedProjectId) {
    return empty;
  }

  const projectIds = allProjects.map((p) => p.id);

  // Account-wide fetches for the projects table + focused project telemetry.
  const [
    hbRes,
    perfRes,
    errRes,
    incRes,
    prevErrRes,
    hbAllRes,
    perfAllRes,
    errAllRes,
    incAllRes,
  ] = await Promise.all([
    supabase
      .from("heartbeats")
      .select("occurred_at, release, environment, memory, uptime")
      .eq("user_id", userId)
      .eq("project_id", selectedProjectId)
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso)
      .order("occurred_at", { ascending: true })
      .limit(500),
    supabase
      .from("performance_logs")
      .select(
        "occurred_at, fcp, lcp, cls, inp, ttfb, page_load, navigation, environment, url",
      )
      .eq("user_id", userId)
      .eq("project_id", selectedProjectId)
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso)
      .order("occurred_at", { ascending: true })
      .limit(500),
    supabase
      .from("errors")
      .select("id, message, level, occurrences, last_seen, environment")
      .eq("user_id", userId)
      .eq("project_id", selectedProjectId)
      .gte("last_seen", fromIso)
      .lte("last_seen", toIso)
      .order("last_seen", { ascending: false })
      .limit(100),
    supabase
      .from("incidents")
      .select(
        "id, project_id, title, status, severity, started_at, resolved_at, downtime_seconds",
      )
      .eq("user_id", userId)
      .eq("project_id", selectedProjectId)
      .gte("started_at", new Date(now - 90 * DAY_MS).toISOString())
      .order("started_at", { ascending: false })
      .limit(100),
    supabase
      .from("errors")
      .select("occurrences")
      .eq("user_id", userId)
      .eq("project_id", selectedProjectId)
      .gte("last_seen", prevFromIso)
      .lt("last_seen", fromIso)
      .limit(200),
    supabase
      .from("heartbeats")
      .select("project_id, occurred_at, environment")
      .eq("user_id", userId)
      .in("project_id", projectIds)
      .gte("occurred_at", new Date(now - DAY_MS).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(1000),
    supabase
      .from("performance_logs")
      .select("project_id, ttfb, page_load, environment")
      .eq("user_id", userId)
      .in("project_id", projectIds)
      .gte("occurred_at", fromIso)
      .limit(1000),
    supabase
      .from("errors")
      .select("project_id, occurrences, level, last_seen")
      .eq("user_id", userId)
      .in("project_id", projectIds)
      .gte("last_seen", fromIso)
      .limit(500),
    supabase
      .from("incidents")
      .select(
        "id, project_id, title, status, severity, started_at, resolved_at, downtime_seconds",
      )
      .eq("user_id", userId)
      .in("project_id", projectIds)
      .gte("started_at", new Date(now - 90 * DAY_MS).toISOString())
      .limit(200),
  ]);

  let heartbeats = hbRes.data ?? [];
  let perfLogs = perfRes.data ?? [];
  let errors = errRes.data ?? [];
  const incidents = (incRes.data ?? []) as IncidentRow[];

  if (params.environment) {
    heartbeats = heartbeats.filter((h) => h.environment === params.environment);
    perfLogs = perfLogs.filter((p) => p.environment === params.environment);
    errors = errors.filter((e) => e.environment === params.environment);
  }

  const heartbeat = analyzeHeartbeats(
    heartbeats.map((h) => h.occurred_at),
    now,
  );

  const ttfbValues = perfLogs
    .map((p) => p.ttfb)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const pageLoadValues = perfLogs
    .map((p) => p.page_load)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const latency = analyzeLatency(ttfbValues, pageLoadValues);

  const latestPerf = perfLogs.length > 0 ? perfLogs[perfLogs.length - 1]! : null;
  const latestHb = heartbeats.length > 0 ? heartbeats[heartbeats.length - 1]! : null;
  const mem = jsonRecord(latestHb?.memory ?? null);

  const performance: PerformanceVitals = {
    fcp: avg(
      perfLogs
        .map((p) => p.fcp)
        .filter((v): v is number => v != null && Number.isFinite(v)),
    ),
    lcp: avg(
      perfLogs
        .map((p) => p.lcp)
        .filter((v): v is number => v != null && Number.isFinite(v)),
    ),
    cls: avg(
      perfLogs
        .map((p) => p.cls)
        .filter((v): v is number => v != null && Number.isFinite(v)),
    ),
    inp: avg(
      perfLogs
        .map((p) => p.inp)
        .filter((v): v is number => v != null && Number.isFinite(v)),
    ),
    ttfb: latency.average,
    pageLoad: avg(pageLoadValues) != null ? round(avg(pageLoadValues)!) : null,
    navigation: latestPerf ? jsonRecord(latestPerf.navigation) : null,
    memoryUsedMb: toMb(
      typeof mem?.usedJSHeapSize === "number" ? mem.usedJSHeapSize : null,
    ),
    memoryTotalMb: toMb(
      typeof mem?.totalJSHeapSize === "number" ? mem.totalJSHeapSize : null,
    ),
    sampleCount: perfLogs.length,
  };

  // Round vitals for display
  for (const key of ["fcp", "lcp", "inp", "ttfb", "pageLoad"] as const) {
    const v = performance[key];
    if (v != null) performance[key] = round(v);
  }
  if (performance.cls != null) {
    performance.cls = Math.round(performance.cls * 1000) / 1000;
  }

  const intervals = downtimeIntervals(incidents, now);
  const uptime = computeUptime(intervals, now);

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const errorOccurrences = errors.reduce((acc, e) => acc + e.occurrences, 0);
  const fatalErrorGroups = errors.filter(
    (e) => e.level === "fatal" || e.level === "error",
  ).length;

  const resolved = incidents.filter((i) => i.resolved_at);
  const recoverySecs = resolved
    .map((i) => {
      const start = new Date(i.started_at).getTime();
      const end = new Date(i.resolved_at!).getTime();
      return (end - start) / 1000;
    })
    .filter((v) => v > 0);
  const meanRecoverySec = avg(recoverySecs);

  const score = computeScores({
    openIncidents,
    errorOccurrences,
    fatalErrorGroups,
    uptime30: uptime.d30,
    heartbeat,
    latency,
    performance,
    meanRecoverySec,
  });

  const prevOcc = (prevErrRes.data ?? []).reduce(
    (acc, e) => acc + e.occurrences,
    0,
  );
  const changePct =
    prevOcc > 0
      ? round(((errorOccurrences - prevOcc) / prevOcc) * 100)
      : errorOccurrences > 0
        ? 100
        : 0;

  // Approximate previous overall: nudge by error-rate change.
  const previousOverall = clamp(round(score.overall - changePct * 0.15));
  let direction: HealthTrend["direction"] = "stable";
  if (heartbeat.stale || changePct >= 15 || score.overall < previousOverall - 5) {
    direction = "degrading";
  } else if (changePct <= -15 || score.overall > previousOverall + 5) {
    direction = "improving";
  }

  const trend: HealthTrend = {
    direction,
    changePct,
    label:
      direction === "improving"
        ? "Improving vs previous window"
        : direction === "degrading"
          ? "Degrading vs previous window"
          : "Stable vs previous window",
    previousOverall,
  };

  const status = deriveStatus({
    overall: score.overall,
    heartbeatStale: heartbeat.stale,
    openCritical: openIncidents.some((i) => i.severity === "critical"),
    investigating: openIncidents.some((i) => i.status === "investigating"),
    recoveredRecently: resolved.some(
      (i) =>
        i.resolved_at &&
        now - new Date(i.resolved_at).getTime() < DAY_MS &&
        openIncidents.length === 0,
    ),
  });

  const timeline = buildTimeline({
    heartbeats: heartbeats.map((h) => ({
      occurred_at: h.occurred_at,
      release: h.release,
    })),
    errors: errors.map((e) => ({
      id: e.id,
      message: e.message,
      last_seen: e.last_seen,
      level: e.level,
    })),
    incidents,
    perf: perfLogs.map((p) => ({
      occurred_at: p.occurred_at,
      lcp: p.lcp,
      page_load: p.page_load,
    })),
  });

  // Per-project rows for the table.
  const lastHbByProject = new Map<string, string>();
  for (const h of hbAllRes.data ?? []) {
    if (params.environment && h.environment !== params.environment) continue;
    if (!lastHbByProject.has(h.project_id)) {
      lastHbByProject.set(h.project_id, h.occurred_at);
    }
  }

  const latencyByProject = new Map<string, number[]>();
  for (const p of perfAllRes.data ?? []) {
    if (params.environment && p.environment !== params.environment) continue;
    if (p.ttfb == null) continue;
    const arr = latencyByProject.get(p.project_id) ?? [];
    arr.push(p.ttfb);
    latencyByProject.set(p.project_id, arr);
  }

  const errorsByProject = new Map<string, number>();
  for (const e of errAllRes.data ?? []) {
    errorsByProject.set(
      e.project_id,
      (errorsByProject.get(e.project_id) ?? 0) + e.occurrences,
    );
  }

  const incidentsByProject = new Map<string, IncidentRow[]>();
  for (const i of (incAllRes.data ?? []) as IncidentRow[]) {
    const arr = incidentsByProject.get(i.project_id) ?? [];
    arr.push(i);
    incidentsByProject.set(i.project_id, arr);
  }

  let projectRows: ProjectHealthRow[] = allProjects.map((project) => {
    const lastHb = lastHbByProject.get(project.id) ?? null;
    const stale =
      !lastHb ||
      now - new Date(lastHb).getTime() > MONITORING.heartbeatTimeoutMs;
    const projectIncidents = incidentsByProject.get(project.id) ?? [];
    const open = projectIncidents.filter((i) => i.status !== "resolved");
    const up = computeUptime(downtimeIntervals(projectIncidents, now), now);
    const latSamples = latencyByProject.get(project.id) ?? [];
    const latAvg = avg(latSamples);
    const occ = errorsByProject.get(project.id) ?? 0;

    let projectScore = 100;
    projectScore -= Math.min(40, open.reduce((a, i) => a + severityWeight(i.severity), 0));
    projectScore -= Math.min(25, Math.floor(occ / 5));
    if (stale && lastHb) projectScore -= 30;
    if (up.d30 < 99) projectScore -= Math.min(20, Math.round((100 - up.d30) * 4));
    projectScore = clamp(round(projectScore));

    const projectStatus = deriveStatus({
      overall: projectScore,
      heartbeatStale: Boolean(lastHb) && stale,
      openCritical: open.some((i) => i.severity === "critical"),
      investigating: open.some((i) => i.status === "investigating"),
      recoveredRecently: projectIncidents.some(
        (i) =>
          i.resolved_at &&
          now - new Date(i.resolved_at).getTime() < DAY_MS &&
          open.length === 0,
      ),
    });

    let projectTrend: ProjectHealthRow["trend"] = "stable";
    if (stale || occ > 20) projectTrend = "degrading";
    else if (occ === 0 && !stale) projectTrend = "improving";

    return {
      id: project.id,
      name: project.name,
      status: projectStatus,
      state: statusToState(projectStatus),
      score: projectScore,
      uptime: up.d30,
      latencyMs: latAvg != null ? round(latAvg) : 0,
      environment: params.environment ?? null,
      lastHeartbeatAt: lastHb,
      openIncidents: open.length,
      trend: projectTrend,
    };
  });

  const search = params.search?.trim().toLowerCase();
  if (search) {
    projectRows = projectRows.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.status.includes(search) ||
        (p.openIncidents > 0 && "incident".includes(search)),
    );
  }
  if (params.status) {
    projectRows = projectRows.filter((p) => p.status === params.status);
  }

  const hasTelemetry =
    heartbeats.length > 0 ||
    perfLogs.length > 0 ||
    errors.length > 0 ||
    incidents.length > 0;

  return {
    score,
    status,
    state: statusToState(status),
    trend,
    uptime,
    heartbeat,
    latency,
    performance,
    timeline,
    projects: projectRows,
    selectedProjectId,
    hasTelemetry,
  };
}

/** Thin summary for home dashboard stats. */
export async function buildHealthSummaryScore(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<{ score: number; state: HealthState; services: ProjectHealthRow[] }> {
  const dash = await buildHealthDashboard(supabase, userId, {});
  return {
    score: dash.score.overall,
    state: dash.state,
    services: dash.projects,
  };
}
