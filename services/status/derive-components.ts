import type {
  ComponentStatusValue,
  StatusComponentKey,
} from "@/lib/constants";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

export interface DeriveSignals {
  openIncidents: Array<{
    severity: IncidentSeverity;
    status: IncidentStatus;
  }>;
  heartbeatAgeMs: number | null;
  recentFatalErrors: number;
  recentErrors: number;
  avgPageLoadMs: number | null;
  failedNotifications: number;
  aiFailures: number;
  authFailures: number;
  maintenanceActive: boolean;
}

const HEARTBEAT_DEGRADED_MS = 5 * 60 * 1000;
const HEARTBEAT_OUTAGE_MS = 15 * 60 * 1000;

function worse(
  a: ComponentStatusValue,
  b: ComponentStatusValue,
): ComponentStatusValue {
  const rank: Record<ComponentStatusValue, number> = {
    operational: 0,
    degraded: 1,
    partial_outage: 2,
    major_outage: 3,
    maintenance: 4,
  };
  return rank[a] >= rank[b] ? a : b;
}

function fromIncidents(
  incidents: DeriveSignals["openIncidents"],
): ComponentStatusValue {
  let status: ComponentStatusValue = "operational";
  for (const incident of incidents) {
    if (incident.status === "resolved") continue;
    if (incident.severity === "critical") return "major_outage";
    if (incident.severity === "high") {
      status = worse(status, "partial_outage");
    } else {
      status = worse(status, "degraded");
    }
  }
  return status;
}

function fromHeartbeat(ageMs: number | null): ComponentStatusValue {
  if (ageMs === null) return "degraded";
  if (ageMs >= HEARTBEAT_OUTAGE_MS) return "major_outage";
  if (ageMs >= HEARTBEAT_DEGRADED_MS) return "partial_outage";
  return "operational";
}

/**
 * Derives a component status from live telemetry + open incidents.
 * Custom components inherit the overall incident-derived status.
 */
export function deriveComponentStatus(
  key: StatusComponentKey | "custom",
  signals: DeriveSignals,
): ComponentStatusValue {
  if (signals.maintenanceActive) {
    return "maintenance";
  }

  const incidentStatus = fromIncidents(signals.openIncidents);
  const heartbeatStatus = fromHeartbeat(signals.heartbeatAgeMs);

  switch (key) {
    case "monitoring":
    case "api":
    case "sdk":
      return worse(
        incidentStatus,
        worse(
          heartbeatStatus,
          signals.recentFatalErrors > 0
            ? "partial_outage"
            : signals.recentErrors > 5
              ? "degraded"
              : "operational",
        ),
      );
    case "database":
      return worse(
        incidentStatus,
        signals.recentFatalErrors > 0
          ? "major_outage"
          : signals.recentErrors > 3
            ? "degraded"
            : "operational",
      );
    case "ai":
      return worse(
        incidentStatus,
        signals.aiFailures > 0 ? "degraded" : "operational",
      );
    case "notifications":
      return worse(
        incidentStatus,
        signals.failedNotifications > 2
          ? "partial_outage"
          : signals.failedNotifications > 0
            ? "degraded"
            : "operational",
      );
    case "email":
      return worse(
        incidentStatus,
        signals.failedNotifications > 0 ? "degraded" : "operational",
      );
    case "authentication":
      return worse(
        incidentStatus,
        signals.authFailures > 0 ? "partial_outage" : "operational",
      );
    case "custom":
    default:
      return worse(
        incidentStatus,
        signals.avgPageLoadMs !== null && signals.avgPageLoadMs > 5000
          ? "degraded"
          : "operational",
      );
  }
}

export function rollupOverallStatus(
  components: ComponentStatusValue[],
  openIncidents: DeriveSignals["openIncidents"],
  maintenanceActive: boolean,
): ComponentStatusValue {
  if (maintenanceActive && openIncidents.length === 0) {
    return "maintenance";
  }
  let status: ComponentStatusValue = fromIncidents(openIncidents);
  for (const component of components) {
    status = worse(status, component);
  }
  return status;
}
