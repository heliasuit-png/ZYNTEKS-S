import type { HealthState } from "@/types/dashboard";

/** Product-facing health status (auto-calculated). */
export type HealthStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "recovered"
  | "investigating";

export type HealthTrendDirection = "improving" | "stable" | "degrading";

export interface HealthScoreBreakdown {
  overall: number;
  reliability: number;
  performance: number;
  availability: number;
  /** Heartbeat consistency sub-score. */
  heartbeat: number;
  /** Error-rate sub-score. */
  errorRate: number;
  /** Latency sub-score. */
  latency: number;
  /** Mean recovery time sub-score. */
  recovery: number;
}

export interface HealthTrend {
  direction: HealthTrendDirection;
  changePct: number;
  label: string;
  previousOverall: number;
}

export interface UptimeWindows {
  h24: number;
  d7: number;
  d30: number;
  d90: number;
  current: number;
}

export interface LatencyStats {
  average: number | null;
  min: number | null;
  max: number | null;
  p95: number | null;
  p99: number | null;
  sampleCount: number;
  /** Chronological series of TTFB samples for charts. */
  series: number[];
  /** Chronological series of page_load (response time). */
  responseSeries: number[];
}

export interface PerformanceVitals {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  pageLoad: number | null;
  navigation: Record<string, unknown> | null;
  memoryUsedMb: number | null;
  memoryTotalMb: number | null;
  sampleCount: number;
}

export interface HeartbeatStats {
  lastAt: string | null;
  count: number;
  averageIntervalSec: number | null;
  expectedIntervalSec: number;
  missingCount: number;
  consistencyScore: number;
  stale: boolean;
  /** Chronological occurred_at timestamps (ISO). */
  history: string[];
  /** Interval seconds between consecutive beats. */
  intervals: number[];
}

export interface HealthTimelineEvent {
  id: string;
  at: string;
  title: string;
  detail?: string;
  kind:
    | "heartbeat"
    | "error"
    | "incident"
    | "recovery"
    | "performance"
    | "deployment";
  tone: "danger" | "warning" | "primary" | "success" | "default";
}

export interface ProjectHealthRow {
  id: string;
  name: string;
  status: HealthStatus;
  state: HealthState;
  score: number;
  uptime: number;
  latencyMs: number;
  environment: string | null;
  lastHeartbeatAt: string | null;
  openIncidents: number;
  trend: HealthTrendDirection;
}

export interface HealthDashboard {
  score: HealthScoreBreakdown;
  status: HealthStatus;
  state: HealthState;
  trend: HealthTrend;
  uptime: UptimeWindows;
  heartbeat: HeartbeatStats;
  latency: LatencyStats;
  performance: PerformanceVitals;
  timeline: HealthTimelineEvent[];
  projects: ProjectHealthRow[];
  selectedProjectId: string | null;
  hasTelemetry: boolean;
}
