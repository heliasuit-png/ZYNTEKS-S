import { getAuthenticatedUser } from "@/services/auth";
import {
  buildHealthDashboard,
  buildHealthSummaryScore,
  type HealthFilterParams,
} from "@/services/health";
import { createSupabaseServerClient } from "@/supabase/server";
import type { HealthState, HealthSummary, ServiceHealth } from "@/types/dashboard";
import type { HealthDashboard } from "@/features/health/types";

function toServiceHealth(row: {
  id: string;
  name: string;
  state: HealthState;
  uptime: number;
  latencyMs: number;
}): ServiceHealth {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    uptime: row.uptime,
    latencyMs: row.latencyMs,
  };
}

/**
 * Overall health summary for the dashboard home widgets.
 * Derived from live heartbeats, performance, errors, and incidents.
 */
export async function getHealthSummary(): Promise<HealthSummary> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return { score: 100, state: "operational", services: [] };
    }
    const summary = await buildHealthSummaryScore(supabase, user.id);
    return {
      score: summary.score,
      state: summary.state,
      services: summary.services.map(toServiceHealth),
    };
  } catch {
    return { score: 100, state: "operational", services: [] };
  }
}

/** Full Health Monitoring dashboard payload. */
export async function getHealthDashboard(
  params: HealthFilterParams = {},
): Promise<HealthDashboard> {
  const empty = await emptyDashboard();
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return empty;
    return await buildHealthDashboard(supabase, user.id, params);
  } catch {
    return empty;
  }
}

async function emptyDashboard(): Promise<HealthDashboard> {
  return {
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
      expectedIntervalSec: 60,
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
}

/** Export health project rows as CSV. */
export async function exportHealthCsv(
  params: HealthFilterParams = {},
): Promise<string> {
  const dash = await getHealthDashboard(params);
  const header = [
    "project_id",
    "project",
    "status",
    "score",
    "uptime_30d",
    "latency_ms",
    "open_incidents",
    "last_heartbeat",
    "trend",
  ];
  const rows = dash.projects.map((p) =>
    [
      p.id,
      csvEscape(p.name),
      p.status,
      p.score,
      p.uptime,
      p.latencyMs,
      p.openIncidents,
      p.lastHeartbeatAt ?? "",
      p.trend,
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

/** Export full health dashboard as JSON string. */
export async function exportHealthJson(
  params: HealthFilterParams = {},
): Promise<string> {
  const dash = await getHealthDashboard(params);
  return JSON.stringify(dash, null, 2);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
