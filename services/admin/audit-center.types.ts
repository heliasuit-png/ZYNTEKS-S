import type {
  AdminAuditAction,
  AdminPlatformRole,
  Json,
} from "@/types/database";

export type AuditRange = "24h" | "7d" | "30d" | "90d" | "all";

export type AuditSeverity = "critical" | "high" | "medium" | "low";

export type AuditCategory =
  | "security"
  | "admin"
  | "workspace"
  | "user"
  | "system";

export type AuditTargetType =
  | "user"
  | "workspace"
  | "feature_flag"
  | "platform_settings"
  | "session"
  | "unknown";

export type AuditResult = "success" | "failure" | "unknown";

export interface AuditFilters {
  q?: string;
  range?: AuditRange;
  from?: string;
  to?: string;
  severity?: AuditSeverity | "";
  category?: AuditCategory | "";
  actorRole?: AdminPlatformRole | "";
  workspaceId?: string;
  projectId?: string;
  result?: AuditResult | "";
  action?: AdminAuditAction | "";
  page?: number;
  pageSize?: number;
}

export interface AuditOverviewKpis {
  totalEvents: number;
  today: number;
  thisWeek: number;
  securityEvents: number;
  adminActions: number;
  workspaceActions: number;
  userActions: number;
  systemActions: number;
}

export interface AuditEventRow {
  id: string;
  timestamp: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: AdminPlatformRole | null;
  action: AdminAuditAction;
  actionLabel: string;
  category: AuditCategory;
  targetType: AuditTargetType;
  targetName: string | null;
  targetUserId: string | null;
  targetWorkspaceId: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  projectId: string | null;
  projectName: string | null;
  severity: AuditSeverity;
  ipAddress: string | null;
  result: AuditResult;
  summary: string;
  metadata: Json;
}

export interface AuditEventDetail extends AuditEventRow {
  previousState: Json | null;
  newState: Json | null;
  relatedEntities: {
    kind: string;
    id: string;
    label: string;
  }[];
}

export interface AuditNamedCount {
  key: string;
  label: string;
  count: number;
}

export interface AuditInsights {
  mostCommonActions: AuditNamedCount[];
  mostActiveAdmins: AuditNamedCount[];
  mostModifiedWorkspaces: AuditNamedCount[];
  mostModifiedUsers: AuditNamedCount[];
  topSecurityEvents: AuditNamedCount[];
}

export interface AuditRetention {
  policy: string;
  policyDays: number | null;
  storedRecords: number;
  oldestRecordAt: string | null;
  newestRecordAt: string | null;
  note: string;
}

export interface AuditCenterData {
  overview: AuditOverviewKpis;
  events: AuditEventRow[];
  timeline: AuditEventRow[];
  insights: AuditInsights;
  retention: AuditRetention;
  totalFiltered: number;
  page: number;
  pageSize: number;
  pageCount: number;
  filters: AuditFilters;
  filterOptions: {
    workspaces: { id: string; name: string }[];
    projects: { id: string; name: string; workspaceId: string }[];
    actions: AdminAuditAction[];
    actorRoles: AdminPlatformRole[];
  };
  unavailable: string[];
}
