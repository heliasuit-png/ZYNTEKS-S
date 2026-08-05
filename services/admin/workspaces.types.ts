import type {
  SubscriptionPlan,
  WorkspaceAdminStatus,
  WorkspaceInvitationStatus,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from "@/types/database";

export type WorkspacesSortField =
  | "name"
  | "owner"
  | "members"
  | "projects"
  | "api_keys"
  | "errors"
  | "incidents"
  | "plan"
  | "storage"
  | "status"
  | "created_at";

export type SortDirection = "asc" | "desc";

export interface WorkspacesListFilters {
  q?: string;
  plan?: SubscriptionPlan | "";
  status?: WorkspaceAdminStatus | "";
  country?: string;
  createdFrom?: string;
  createdTo?: string;
  storage?: "any" | "with_logo" | "no_logo" | "";
  membersMin?: number | "";
  membersMax?: number | "";
  sort?: WorkspacesSortField;
  direction?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface WorkspacesOverviewStats {
  totalWorkspaces: number;
  newToday: number;
  activeWorkspaces: number;
  enterprisePlans: number;
  averageMembers: number;
  averageProjects: number;
  averageApiKeys: number;
  aiUsageTokens30d: number;
  storageBytes: number;
}

export interface AdminWorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string | null;
  memberCount: number;
  projectCount: number;
  apiKeyCount: number;
  errorCount30d: number;
  incidentCount30d: number;
  plan: SubscriptionPlan;
  storageBytes: number;
  status: WorkspaceAdminStatus;
  country: string | null;
  createdAt: string;
}

export interface WorkspacesListResult {
  items: AdminWorkspaceListItem[];
  total: number;
  page: number;
  pageSize: number;
  overview: WorkspacesOverviewStats;
}

export interface WorkspaceAnalyticsPoint {
  label: string;
  projects: number;
  apiRequests: number;
  errors: number;
  aiTokens: number;
  members: number;
  growth: number;
}

export interface AdminWorkspaceDetail {
  workspace: AdminWorkspaceListItem;
  timezone: string;
  notificationDefaults: unknown;
  securityPolicies: unknown;
  healthScore: number | null;
  heartbeatStatus: "healthy" | "degraded" | "silent" | "none";
  lastHeartbeatAt: string | null;
  aiUsage: { requests: number; tokens: number };
  notificationCount30d: number;
  members: {
    id: string;
    userId: string;
    email: string;
    fullName: string | null;
    role: WorkspaceRole;
    status: WorkspaceMemberStatus;
    joinedAt: string;
  }[];
  invitations: {
    id: string;
    email: string;
    role: WorkspaceRole;
    status: WorkspaceInvitationStatus;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
  }[];
  projects: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
  }[];
  apiKeys: {
    id: string;
    name: string;
    keyPrefix: string;
    status: string;
    environment: string;
    projectId: string;
    lastUsedAt: string | null;
  }[];
  recentErrors: {
    id: string;
    message: string;
    level: string;
    occurredAt: string;
  }[];
  recentIncidents: {
    id: string;
    title: string;
    status: string;
    severity: string;
    detectedAt: string;
  }[];
  activity: {
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    summary: string;
    actorId: string | null;
    createdAt: string;
  }[];
  analytics: WorkspaceAnalyticsPoint[];
  errorTrend: { label: string; value: number }[];
  incidentTrend: { label: string; value: number }[];
  apiRequestTrend: { label: string; value: number }[];
}
