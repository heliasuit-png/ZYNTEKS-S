/**
 * Dashboard domain types. These describe the data contracts consumed by the
 * dashboard UI and produced by the dashboard service layer, so real data can
 * be wired into the services later without touching the UI.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ProjectStatus = "active" | "paused" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ApiKeyStatus = "active" | "revoked";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
}

export type ErrorLevel = "fatal" | "error" | "warning" | "info" | "debug";

/** Dashboard list/detail view of a deduplicated error group. */
export interface ErrorEvent {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  level: ErrorLevel;
  type: string | null;
  url: string | null;
  fingerprint: string;
  occurrences: number;
  environment: string;
  release: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  /** Display label: project name or URL host. */
  source: string;
}

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

/** Aligns with DB `incident_severity`. */
export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  projectId: string;
  projectName: string;
  environment: string | null;
  startedAt: string;
  resolvedAt: string | null;
  downtimeSeconds: number | null;
  durationSeconds: number;
  assignee: string;
  aiRecommendation: string | null;
  source: string;
}

export type HealthState = "operational" | "degraded" | "down";

export interface ServiceHealth {
  id: string;
  name: string;
  state: HealthState;
  uptime: number;
  latencyMs: number;
}

export interface HealthSummary {
  score: number;
  state: HealthState;
  services: ServiceHealth[];
}

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  model: string;
  messageCount: number;
  updatedAt: string;
}

export type ActivityType =
  | "project"
  | "api_key"
  | "error"
  | "incident"
  | "billing"
  | "member";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
}

export interface SystemComponent {
  id: string;
  name: string;
  state: HealthState;
}

export interface SystemStatus {
  overall: HealthState;
  components: SystemComponent[];
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  apiRequestsToday: number;
  errorsToday: number;
  healthScore: number;
  openIncidents: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  recentErrors: ErrorEvent[];
  recentNotifications: NotificationItem[];
  recentConversations: AiConversation[];
  systemStatus: SystemStatus;
}

export type BillingPlan = "free" | "pro" | "enterprise";

export interface BillingInvoice {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
}

export interface BillingUsage {
  projects: number;
  projectLimit: number;
  apiKeys: number;
  apiKeysPerProject: number;
  members: number;
  aiMessages30d: number;
}

export interface BillingOverview {
  plan: BillingPlan;
  status: "active" | "trialing" | "past_due" | "canceled";
  seats: number;
  amountDueCents: number;
  currency: string;
  nextInvoiceAt: string | null;
  invoices: BillingInvoice[];
  usage: BillingUsage;
  /** False until a real PaymentProvider is registered in services/billing/factory.ts */
  providerConfigured: boolean;
  providerId: string;
  providerDisplayName: string;
}
