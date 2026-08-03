import type { BadgeProps } from "@/components/dashboard/badge";
import type { HealthStatus } from "@/features/health/types";

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  recovered: "Recovered",
  investigating: "Investigating",
};

export const HEALTH_STATUS_TONE: Record<HealthStatus, BadgeProps["tone"]> = {
  healthy: "success",
  warning: "warning",
  critical: "danger",
  recovered: "primary",
  investigating: "warning",
};

export const HEALTH_STATUSES: HealthStatus[] = [
  "healthy",
  "warning",
  "critical",
  "recovered",
  "investigating",
];
