import type { AdminPlatformRole, AdminAuditAction } from "@/types/database";
import type { AdminPermission } from "@/services/admin/types";

export type SecurityRange = "24h" | "7d" | "30d";

export type SecuritySeverity = "critical" | "high" | "medium" | "low";

export type SecurityEventType =
  | "api_auth_failed"
  | "api_auth_success"
  | "api_key_revoked"
  | "session_created"
  | "session_revoked"
  | "user_suspended"
  | "admin_action"
  | "incident";

export interface SecurityCenterFilters {
  q?: string;
  severity?: SecuritySeverity | "";
  eventType?: SecurityEventType | "";
  from?: string;
  to?: string;
  range?: SecurityRange;
  role?: AdminPlatformRole | "";
  workspaceId?: string;
}

export interface SecurityOverviewKpis {
  securityScore: number;
  riskLevel: SecuritySeverity;
  /** Login failures + API key auth_failed in window. */
  failedApiAuth: number;
  /** Successful product logins (auth_login_events) or session creates. */
  successfulSessions: number;
  /** Always null — rate-limit / block history is not persisted. */
  blockedRequests: number | null;
  suspendedUsers: number;
  adminAccounts: number;
  apiKeyFailures: number;
  securityEvents: number;
  activeSessions: number;
}

export interface ThreatItem {
  id: string;
  severity: SecuritySeverity;
  title: string;
  detail: string;
  source: string;
  occurredAt: string;
  userId: string | null;
  userEmail: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  projectId: string | null;
  projectName: string | null;
}

export interface LoginSessionRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  browser: string | null;
  os: string | null;
  deviceLabel: string | null;
  country: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
  revokedAt: string | null;
  flags: Array<"unknown_device" | "unknown_country" | "new_browser" | "new_ip">;
}

export interface ActiveSessionRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  browser: string | null;
  os: string | null;
  deviceLabel: string | null;
  country: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface ApiSecurityStats {
  failedAuth: number;
  successfulAuth: number;
  revokedKeys: number;
  /** Always null — api_keys has no expiry column. */
  expiredKeys: number | null;
  mostUsed: {
    id: string;
    name: string;
    keyPrefix: string;
    projectId: string;
    projectName: string;
    lastUsedAt: string | null;
    useEvents: number;
  }[];
  abuseAttempts: {
    ipAddress: string | null;
    failures: number;
    lastSeen: string;
  }[];
  recentFailures: {
    id: string;
    apiKeyId: string | null;
    projectId: string | null;
    projectName: string | null;
    userId: string | null;
    ipAddress: string | null;
    createdAt: string;
  }[];
}

export interface AdminSecurityAccount {
  userId: string;
  email: string;
  fullName: string | null;
  role: AdminPlatformRole;
  lastLogin: string | null;
  permissions: AdminPermission[];
  recentActions: number;
}

export interface AuditTimelineItem {
  id: string;
  source: "admin_audit" | "api_key_log" | "session" | "incident";
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  action: string;
  summary: string;
  actorId: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  workspaceId: string | null;
  projectId: string | null;
  ipAddress: string | null;
  occurredAt: string;
  adminAction?: AdminAuditAction;
}

export interface RiskAnalysis {
  overallScore: number;
  riskLevel: SecuritySeverity;
  trend: { label: string; score: number }[];
  recommendations: string[];
}

export interface SecurityAlertItem {
  id: string;
  title: string;
  severity: SecuritySeverity;
  source: string;
  status: "open" | "acknowledged" | "resolved";
  occurredAt: string;
}

export interface SecurityCenterData {
  generatedAt: string;
  filters: SecurityCenterFilters;
  overview: SecurityOverviewKpis;
  threats: {
    critical: ThreatItem[];
    high: ThreatItem[];
    medium: ThreatItem[];
    low: ThreatItem[];
    timeline: ThreatItem[];
  };
  loginSecurity: {
    recentLogins: LoginSessionRow[];
    failedApiAuth: AuditTimelineItem[];
    flaggedSessions: LoginSessionRow[];
  };
  activeSessions: ActiveSessionRow[];
  apiSecurity: ApiSecurityStats;
  adminSecurity: {
    accounts: AdminSecurityAccount[];
    recentActions: AuditTimelineItem[];
  };
  audit: AuditTimelineItem[];
  risk: RiskAnalysis;
  alerts: SecurityAlertItem[];
  filterOptions: {
    workspaces: { id: string; name: string }[];
  };
  unavailable: string[];
}
