/**
 * Application-wide constants. Keep values here that are static, safe to expose
 * and shared across multiple modules.
 */

import type {
  ApiKeyEnvironment,
  AuditAction,
  IncidentSeverity,
  IncidentStatus,
  NotificationChannel,
  NotificationType,
  ProjectFramework,
  ProjectStatus,
  SubscriptionPlan,
  WorkspaceRole,
} from "@/types/database";

export const APP_NAME = "ZYNTEKSIS" as const;
export const APP_DESCRIPTION =
  "Production-ready SaaS platform powered by ZYNTEKSIS." as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const ERROR_CODE = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  INTERNAL: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  docs: "/docs",
  privacy: "/privacy",
  terms: "/terms",
  contact: "/contact",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  maintenance: "/maintenance",
} as const;

export const AUTH_ROUTES = {
  callback: "/auth/callback",
  confirm: "/auth/confirm",
} as const;

export const DASHBOARD_ROUTES = {
  dashboard: "/dashboard",
  projects: "/projects",
  apiKeys: "/api-keys",
  errors: "/errors",
  incidents: "/incidents",
  health: "/health",
  insights: "/insights",
  aiAssistant: "/ai",
  notifications: "/notifications",
  statusPages: "/status-pages",
  billing: "/billing",
  settings: "/settings",
  settingsAppearance: "/settings/appearance",
  settingsAi: "/settings/ai",
  settingsApi: "/settings/api",
  profile: "/profile",
  members: "/members",
  audit: "/audit",
  security: "/security",
  organization: "/organization",
  invitations: "/invitations",
} as const;

export type DashboardRoute =
  (typeof DASHBOARD_ROUTES)[keyof typeof DASHBOARD_ROUTES];

/**
 * Enterprise Admin Control Center routes.
 * Gated by `admin_users` membership (not workspace RBAC / profiles.role).
 */
export const ADMIN_ROUTES = {
  root: "/admin",
  login: "/admin/login",
  dashboard: "/admin/dashboard",
  users: "/admin/users",
  workspaces: "/admin/workspaces",
  projects: "/admin/projects",
  monitoring: "/admin/monitoring",
  apiKeys: "/admin/api-keys",
  analytics: "/admin/analytics",
  ai: "/admin/ai",
  notifications: "/admin/notifications",
  security: "/admin/security",
  auditLogs: "/admin/audit",
  settings: "/admin/settings",
} as const;

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

/** Routes that require an authenticated session. */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/projects",
  "/api-keys",
  "/errors",
  "/incidents",
  "/health",
  "/insights",
  "/ai",
  "/notifications",
  "/status-pages",
  "/billing",
  "/settings",
  "/profile",
  "/members",
  "/audit",
  "/security",
  "/organization",
  "/invitations",
] as const;

/** Auth routes that a signed-in user should be redirected away from. */
export const GUEST_ONLY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
] as const;

export const API_ROUTES = {
  health: "/api/health",
  cronHealth: "/api/cron/health",
  cronMonitor: "/api/cron/monitor",
  projects: "/api/projects",
  apiKeys: "/api/api-keys",
  sdkError: "/api/sdk/error",
  sdkHeartbeat: "/api/sdk/heartbeat",
  sdkPerformance: "/api/sdk/performance",
  sdkEvents: "/api/sdk/events",
  aiChat: "/api/ai/chat",
} as const;

/** Public status page base path: `/status/<slug>`. */
export const STATUS_PAGE_BASE_PATH = "/status" as const;

// --- SDK ingestion --------------------------------------------------------

export const SDK_INGEST = {
  /** Errors sharing a fingerprint within this window are deduplicated. */
  dedupWindowMs: 5 * 60 * 1000,
  /** Per-project, per-instance best-effort rate limit. */
  rateLimit: { windowMs: 60 * 1000, max: 240 },
  /** Maximum accepted request body size per endpoint, in bytes. */
  maxPayloadBytes: {
    error: 256 * 1024,
    heartbeat: 32 * 1024,
    performance: 64 * 1024,
    events: 256 * 1024,
  },
  /** Maximum number of events accepted in a single /events request. */
  maxEventsPerRequest: 50,
} as const;

// --- Projects -------------------------------------------------------------

export const PROJECT_FRAMEWORKS = [
  "nextjs",
  "react",
  "vue",
  "angular",
  "nuxt",
  "express",
  "nodejs",
  "laravel",
  "django",
  "aspnet",
  "flutter_web",
  "other",
] as const satisfies readonly ProjectFramework[];

export const PROJECT_FRAMEWORK_LABELS: Record<ProjectFramework, string> = {
  nextjs: "Next.js",
  react: "React",
  vue: "Vue",
  angular: "Angular",
  nuxt: "Nuxt",
  express: "Express",
  nodejs: "Node.js",
  laravel: "Laravel",
  django: "Django",
  aspnet: "ASP.NET",
  flutter_web: "Flutter Web",
  other: "Other",
};

export const PROJECT_STATUSES = [
  "active",
  "paused",
  "archived",
] as const satisfies readonly ProjectStatus[];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

// --- API keys -------------------------------------------------------------

export const API_KEY_PREFIX = "ZYN-KEY-" as const;
/** Number of random characters after the prefix. */
export const API_KEY_RANDOM_LENGTH = 32 as const;
/** Number of leading random characters shown in the masked/display prefix. */
export const API_KEY_VISIBLE_CHARS = 4 as const;
/** Number of mask characters shown after the visible prefix. */
export const API_KEY_MASK_LENGTH = 24 as const;

export const API_KEY_ENVIRONMENTS = [
  "production",
  "staging",
  "development",
] as const satisfies readonly ApiKeyEnvironment[];

export const API_KEY_ENVIRONMENT_LABELS: Record<ApiKeyEnvironment, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
};

// --- Subscription plan limits --------------------------------------------

export interface PlanLimits {
  projects: number;
  apiKeysPerProject: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: { projects: 3, apiKeysPerProject: 3 },
  pro: { projects: 25, apiKeysPerProject: 20 },
  enterprise: { projects: 1000, apiKeysPerProject: 200 },
};

// --- Incidents ------------------------------------------------------------

export const INCIDENT_STATUSES = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const satisfies readonly IncidentStatus[];

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export const INCIDENT_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly IncidentSeverity[];

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

// --- Notifications --------------------------------------------------------

export const NOTIFICATION_TYPES = [
  "incident_created",
  "incident_resolved",
  "critical_error",
  "api_key_revoked",
  "project_created",
] as const satisfies readonly NotificationType[];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  incident_created: "Incident created",
  incident_resolved: "Incident resolved",
  critical_error: "Critical error",
  api_key_revoked: "API key revoked",
  project_created: "Project created",
};

/** Product categories shown in the Notification Center filters and preferences. */
export const NOTIFICATION_CATEGORIES = [
  "error",
  "incident",
  "health",
  "api_key",
  "billing",
  "workspace",
  "ai",
  "security",
  "system",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> =
  {
    error: "Error",
    incident: "Incident",
    health: "Health",
    api_key: "API Key",
    billing: "Billing",
    workspace: "Workspace",
    ai: "AI",
    security: "Security",
    system: "System",
  };

export const NOTIFICATION_TYPE_CATEGORY: Record<
  NotificationType,
  NotificationCategory
> = {
  critical_error: "error",
  incident_created: "incident",
  incident_resolved: "incident",
  api_key_revoked: "api_key",
  project_created: "system",
};

export const NOTIFICATION_CHANNELS = [
  "email",
  "dashboard",
  "slack",
  "discord",
] as const satisfies readonly NotificationChannel[];

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> =
  {
    email: "Email",
    dashboard: "Dashboard",
    slack: "Slack",
    discord: "Discord",
  };

export const NOTIFICATION_LEVELS = [
  "info",
  "success",
  "warning",
  "error",
] as const;

// --- Workspaces / enterprise ----------------------------------------------

export const WORKSPACE_ROLES = [
  "owner",
  "administrator",
  "developer",
  "viewer",
  "billing_manager",
] as const satisfies readonly WorkspaceRole[];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  administrator: "Administrator",
  developer: "Developer",
  viewer: "Viewer",
  billing_manager: "Billing Manager",
};

export const AUDIT_ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  login: "Login",
  logout: "Logout",
  project_created: "Project created",
  api_key_generated: "API key generated",
  incident_closed: "Incident closed",
  ai_analysis: "AI analysis",
  invitation_sent: "Invitation sent",
  invitation_accepted: "Invitation accepted",
  role_changed: "Permission changed",
  ownership_transferred: "Ownership transferred",
  billing_changed: "Billing",
  session_revoked: "Session revoked",
  password_changed: "Password changed",
};

// --- Monitoring engine ----------------------------------------------------

export const MONITORING = {
  /** A project with no heartbeat for longer than this is considered down. */
  heartbeatTimeoutMs: 20 * 60 * 1000,
  /** How recently a heartbeat must arrive to be considered "alive". */
  aliveWindowMs: 20 * 60 * 1000,
  /** Look-back window used when scanning for notifiable events. */
  eventScanWindowMs: 2 * 60 * 1000,
  /** Maximum notification queue rows processed per cron pass. */
  queueBatchSize: 100,
  /** Maximum delivery attempts before a queued notification is failed. */
  maxDeliveryAttempts: 5,
  /** Number of days rendered on the public status page history strip. */
  statusHistoryDays: 90,
} as const;

// --- AI assistant ---------------------------------------------------------

export const AI = {
  /** Maximum characters accepted in a single user message. */
  maxMessageChars: 8000,
  /** Number of prior messages included as conversation history. */
  maxHistoryMessages: 20,
  /** Per-user request rate limit for the chat endpoint. */
  rateLimit: { windowMs: 60 * 1000, max: 20 },
  /** Context builder caps (read-only project telemetry). */
  context: {
    maxErrors: 8,
    maxIncidents: 5,
    maxErrorEvents: 12,
    maxPerfSamples: 8,
    maxApiKeyLogs: 12,
    maxStackChars: 1800,
  },
  /** Sampling temperature for the assistant. */
  temperature: 0.4,
  /** Characters used to derive a conversation title from the first message. */
  titleMaxChars: 60,
} as const;

/**
 * Monthly AI message allowance per plan. `null` means unlimited.
 * Starter (free) is capped; Pro and Enterprise are unlimited.
 */
export const AI_MONTHLY_MESSAGE_LIMITS: Record<
  SubscriptionPlan,
  number | null
> = {
  free: 200,
  pro: null,
  enterprise: null,
};

/** Uptime windows exposed on the status page, in milliseconds. */
export const UPTIME_WINDOWS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
} as const;

export type UptimeWindowKey = keyof typeof UPTIME_WINDOWS;

export const UPTIME_WINDOW_LABELS: Record<UptimeWindowKey, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

/** Default status-page components auto-seeded for each project. */
export const STATUS_COMPONENT_KEYS = [
  "api",
  "database",
  "sdk",
  "ai",
  "monitoring",
  "notifications",
  "email",
  "authentication",
] as const;

export type StatusComponentKey = (typeof STATUS_COMPONENT_KEYS)[number];

export const STATUS_COMPONENT_LABELS: Record<StatusComponentKey, string> = {
  api: "API",
  database: "Database",
  sdk: "SDK",
  ai: "AI",
  monitoring: "Monitoring",
  notifications: "Notifications",
  email: "Email",
  authentication: "Authentication",
};

export const STATUS_COMPONENT_DESCRIPTIONS: Record<StatusComponentKey, string> =
  {
    api: "Public and private API availability",
    database: "Primary data store health",
    sdk: "Client SDK ingestion and heartbeats",
    ai: "AI assistant availability",
    monitoring: "Health checks and uptime monitoring",
    notifications: "In-app and webhook notification delivery",
    email: "Transactional email delivery",
    authentication: "Sign-in and session services",
  };

export const COMPONENT_STATUSES = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
] as const;

export type ComponentStatusValue = (typeof COMPONENT_STATUSES)[number];

export const COMPONENT_STATUS_LABELS: Record<ComponentStatusValue, string> = {
  operational: "Operational",
  degraded: "Degraded",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  maintenance: "Maintenance",
};

export const MAINTENANCE_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
