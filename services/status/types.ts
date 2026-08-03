import type {
  Database,
  IncidentSeverity,
  IncidentStatus,
  StatusMaintenanceStatus,
} from "@/types/database";
import type {
  ComponentStatusValue,
  StatusComponentKey,
  UptimeWindowKey,
} from "@/lib/constants";

export type StatusPage = Database["public"]["Tables"]["status_pages"]["Row"];
export type StatusPageComponent =
  Database["public"]["Tables"]["status_page_components"]["Row"];
export type StatusPageMaintenance =
  Database["public"]["Tables"]["status_page_maintenance"]["Row"];

export type OverallStatus = ComponentStatusValue;
export type DayStatus = "operational" | "degraded" | "down" | "no_data";
export type ComponentStatus = ComponentStatusValue;

export interface StatusPageListItem {
  page: StatusPage;
  projectName: string;
  projectStatus: string;
}

export interface StatusPageDetail {
  page: StatusPage;
  projectName: string;
  components: StatusPageComponent[];
  maintenance: StatusPageMaintenance[];
}

export interface PublicIncidentUpdate {
  id: string;
  message: string;
  status: IncidentStatus | null;
  createdAt: string;
}

export interface PublicIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  startedAt: string;
  resolvedAt: string | null;
  downtimeSeconds: number | null;
  recoverySeconds: number | null;
  projectName: string;
  timeline: PublicIncidentUpdate[];
}

export interface DayHistoryPoint {
  date: string;
  status: DayStatus;
  downtimeSeconds: number;
  uptimePercent: number;
}

export interface ResponsePoint {
  date: string;
  avgMs: number | null;
}

export interface PublicComponent {
  id: string;
  name: string;
  description: string | null;
  key: StatusComponentKey | "custom";
  status: ComponentStatus;
}

export interface PublicMaintenance {
  id: string;
  title: string;
  description: string | null;
  status: StatusMaintenanceStatus;
  scheduledStart: string;
  scheduledEnd: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PublicStatusPage {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  projectName: string;
  projectId: string;
  logoUrl: string | null;
  brandColor: string;
  timezone: string;
  contactEmail: string | null;
  footerText: string | null;
  currentStatus: OverallStatus;
  currentUptime: number;
  uptime: Record<UptimeWindowKey, number>;
  history: DayHistoryPoint[];
  activeIncidents: PublicIncident[];
  resolvedIncidents: PublicIncident[];
  incidents: PublicIncident[];
  maintenance: PublicMaintenance[];
  upcomingMaintenance: PublicMaintenance[];
  responseSeries: ResponsePoint[];
  avgResponseMs: number | null;
  components: PublicComponent[];
  updatedAt: string;
}

export interface PublicStatusDirectoryItem {
  slug: string;
  name: string;
  projectName: string;
  description: string | null;
  currentStatus: OverallStatus;
  currentUptime: number;
  brandColor: string;
}
