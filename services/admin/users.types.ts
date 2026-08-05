import type {
  AdminPlatformRole,
  SubscriptionPlan,
  UserRole,
  UserStatus,
} from "@/types/database";

export type UsersSortField =
  | "full_name"
  | "email"
  | "role"
  | "plan"
  | "status"
  | "last_login"
  | "created_at"
  | "projects";

export type SortDirection = "asc" | "desc";

export interface UsersListFilters {
  q?: string;
  role?: "platform_admin" | "user" | "product_admin" | "";
  plan?: SubscriptionPlan | "";
  status?: UserStatus | "";
  verified?: "yes" | "no" | "";
  country?: string;
  createdFrom?: string;
  createdTo?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
  sort?: UsersSortField;
  direction?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface UsersOverviewStats {
  totalUsers: number;
  newToday: number;
  activeToday: number;
  verifiedUsers: number;
  suspendedUsers: number;
  admins: number;
  workspaceOwners: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  productRole: UserRole;
  platformRole: AdminPlatformRole | null;
  displayRole: string;
  workspaceName: string | null;
  workspaceId: string | null;
  projectCount: number;
  plan: SubscriptionPlan;
  status: UserStatus;
  verified: boolean | null;
  country: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  /** Supabase Auth identity providers linked to this user. */
  authProviders: string[];
  mfaEnabled: boolean;
}

export interface AdminUserDetail {
  profile: AdminUserListItem;
  phone: null;
  timezone: string;
  language: string;
  subscriptionPlan: SubscriptionPlan;
  projects: { id: string; name: string; slug: string; status: string }[];
  apiKeys: {
    id: string;
    name: string;
    keyPrefix: string;
    status: string;
    environment: string;
    lastUsedAt: string | null;
  }[];
  aiUsage: { requests: number; tokens: number };
  recentErrors: {
    id: string;
    message: string;
    level: string;
    lastSeen: string;
  }[];
  recentIncidents: {
    id: string;
    title: string;
    status: string;
    severity: string;
    detectedAt: string;
  }[];
  sessions: {
    id: string;
    deviceLabel: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    ipAddress: string | null;
    lastActiveAt: string;
    isCurrent: boolean;
    revokedAt: string | null;
  }[];
  ownedWorkspaces: { id: string; name: string; slug: string }[];
  activity: {
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
  }[];
  loginHistory: {
    id: string;
    method: string;
    result: string;
    provider: string | null;
    deviceLabel: string | null;
    ipAddress: string | null;
    country: string | null;
    isSuspicious: boolean;
    createdAt: string;
  }[];
  security: {
    failedApiKeyAuth24h: number;
    failedLogins24h: number;
    activeSessions: number;
    blockedNote: string;
    suspiciousNote: string;
    newestFailures: {
      id: string;
      detail: string;
      occurredAt: string;
    }[];
  };
}

export interface UsersListResult {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  overview: UsersOverviewStats;
}
