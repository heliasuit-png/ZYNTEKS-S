import type { AdminPermission } from "@/services/admin/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

export type DashboardRange = "24h" | "7d" | "30d";

export type HealthTone = "green" | "yellow" | "red";

export interface ExecutiveKpis {
  totalUsers: number;
  activeUsers24h: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalApiKeys: number;
  aiRequestsToday: number;
  errorsToday: number;
  openIncidents: number;
  averageResponseTimeMs: number | null;
  uptimePercent30d: number;
}

export interface ActivityFeedItem {
  id: string;
  kind:
    | "user_created"
    | "workspace_created"
    | "api_key_generated"
    | "error_received"
    | "incident_opened"
    | "ai_analysis"
    | "notification_sent"
    | "audit";
  title: string;
  description: string;
  occurredAt: string;
}

export interface MonitoringComponentStatus {
  id:
    | "system"
    | "database"
    | "api"
    | "storage"
    | "ai"
    | "mail"
    | "queue"
    | "cron";
  label: string;
  tone: HealthTone;
  detail: string;
}

export interface UsageSeriesPoint {
  /** ISO date or hour bucket label */
  label: string;
  users: number;
  errors: number;
  aiRequests: number;
  projects: number;
  apiCalls: number;
}

export interface CountryUsageRow {
  country: string;
  sessions: number;
  users: number;
}

export interface SecurityEventItem {
  id: string;
  kind: "auth_failed" | "rate_signal" | "suspicious";
  title: string;
  detail: string;
  occurredAt: string;
}

export interface SecurityOverview {
  failedApiKeyAuth24h: number;
  blockedSignal: string;
  rateLimitNote: string;
  suspiciousCount24h: number;
  newest: SecurityEventItem[];
}

export interface IncidentSummaryItem {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  projectId: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface ApiEndpointStat {
  endpoint: string;
  traffic: number;
  failures: number;
  avgLatencyMs: number | null;
}

export interface AiOverviewStats {
  requestsInRange: number;
  tokensInRange: number;
  models: { model: string; requests: number; tokens: number }[];
  averageLatencyMs: number | null;
}

export interface QuickActionDef {
  id: string;
  label: string;
  description: string;
  href: string | null;
  enabled: boolean;
  permission: AdminPermission;
}

export interface ExecutiveDashboardData {
  generatedAt: string;
  range: DashboardRange;
  kpis: ExecutiveKpis;
  activity: ActivityFeedItem[];
  monitoring: MonitoringComponentStatus[];
  usage: UsageSeriesPoint[];
  geography: {
    countries: CountryUsageRow[];
    cityNote: string;
  };
  quickActions: QuickActionDef[];
  security: SecurityOverview;
  incidents: {
    open: IncidentSummaryItem[];
    monitoring: IncidentSummaryItem[];
    resolved: IncidentSummaryItem[];
  };
  api: ApiEndpointStat[];
  ai: AiOverviewStats;
}
