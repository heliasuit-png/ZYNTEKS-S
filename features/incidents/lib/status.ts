import type { BadgeProps } from "@/components/dashboard/badge";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

export const INCIDENT_SEVERITY_TONE: Record<
  IncidentSeverity,
  BadgeProps["tone"]
> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "default",
};

export const INCIDENT_STATUS_TONE: Record<IncidentStatus, BadgeProps["tone"]> = {
  investigating: "danger",
  identified: "warning",
  monitoring: "primary",
  resolved: "success",
};
