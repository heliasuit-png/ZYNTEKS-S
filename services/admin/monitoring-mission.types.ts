import type { HealthTone } from "@/services/admin/executive-dashboard.types";
import type {
  ApiKeyEnvironment,
  EventLevel,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/database";

export type MonitoringRange = "1h" | "24h" | "7d" | "30d";

export interface MonitoringMissionFilters {
  workspaceId?: string;
  projectId?: string;
  country?: string;
  environment?: ApiKeyEnvironment | "";
  from?: string;
  to?: string;
  range?: MonitoringRange;
  severity?: IncidentSeverity | EventLevel | "";
}

export type ProbeId =
  | "platform"
  | "database"
  | "api"
  | "sdk"
  | "ai"
  | "cron"
  | "storage"
  | "mail"
  | "queue";

export interface StatusProbe {
  id: ProbeId;
  label: string;
  tone: HealthTone;
  detail: string;
}

export interface LiveMetrics {
  apiRequestsPerSec: number;
  errorsPerMin: number;
  heartbeatsPerMin: number;
  aiRequestsPerMin: number;
  averageResponseTimeMs: number | null;
  p95ResponseTimeMs: number | null;
  p99ResponseTimeMs: number | null;
  databaseLatencyMs: number | null;
  cpuAvailable: false;
  memoryMbAvg: number | null;
  uptimePercent30d: number;
}

export type StreamKind =
  | "error"
  | "heartbeat"
  | "performance"
  | "incident"
  | "notification"
  | "api_key"
  | "workspace"
  | "ai";

export interface StreamEvent {
  id: string;
  kind: StreamKind;
  title: string;
  detail: string;
  occurredAt: string;
  severity?: string | null;
  projectId?: string | null;
  workspaceId?: string | null;
  environment?: string | null;
  country?: string | null;
}

export interface MapCountryPoint {
  country: string;
  sessions: number;
  users: number;
  /** Approximate map position 0–100 */
  x: number;
  y: number;
}

export interface HealthBucketCounts {
  healthy: number;
  warning: number;
  critical: number;
  offline: number;
  total: number;
}

export interface ProjectHealthSummary {
  projectId: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  status: "healthy" | "warning" | "critical" | "offline";
  score: number | null;
  lastHeartbeatAt: string | null;
  openIncidents: number;
  environment: ApiKeyEnvironment | null;
}

export interface IncidentPanelItem {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface TopErrorItem {
  id: string;
  message: string;
  level: EventLevel;
  occurrences: number;
  lastSeen: string;
  projectId: string;
  projectName: string;
  environment: ApiKeyEnvironment;
  stackSummary: string | null;
}

export interface EndpointLatencyItem {
  url: string;
  samples: number;
  avgMs: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
}

export interface SdkVersionRow {
  release: string;
  environment: ApiKeyEnvironment;
  heartbeats: number;
  lastSeen: string;
}

export interface CronJobRow {
  name: string;
  schedule: string;
  path: string;
  lastRun: string | null;
  nextRun: string | null;
  durationMs: number | null;
  failures: number | null;
  note: string;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  occurredAt: string;
}

export interface MonitoringMissionData {
  generatedAt: string;
  filters: MonitoringMissionFilters;
  globalStatus: {
    platformTone: HealthTone;
    platformLabel: string;
    probes: StatusProbe[];
    responseTimeMs: number | null;
    uptimePercent30d: number;
  };
  liveMetrics: LiveMetrics;
  stream: StreamEvent[];
  geography: {
    countries: MapCountryPoint[];
    topRegions: { label: string; sessions: number }[];
    cityNote: string;
    requestProxyNote: string;
  };
  health: {
    counts: HealthBucketCounts;
    projects: ProjectHealthSummary[];
  };
  incidents: {
    open: IncidentPanelItem[];
    monitoring: IncidentPanelItem[];
    resolved: IncidentPanelItem[];
  };
  errors: {
    top: TopErrorItem[];
    newest: TopErrorItem[];
    trend: { label: string; value: number }[];
  };
  performance: {
    endpoints: EndpointLatencyItem[];
    slowest: EndpointLatencyItem[];
  };
  sdk: {
    versions: SdkVersionRow[];
    productionHeartbeats: number;
    developmentHeartbeats: number;
    stagingHeartbeats: number;
    silentProjects: number;
  };
  cron: CronJobRow[];
  alerts: AlertItem[];
  filterOptions: {
    workspaces: { id: string; name: string }[];
    projects: { id: string; name: string; workspaceId: string }[];
  };
  unavailable: string[];
}
