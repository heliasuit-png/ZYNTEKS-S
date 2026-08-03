import type { IncidentStatus } from "@/types/database";
import { INCIDENT_STATUSES } from "@/lib/constants";

const ORDER = INCIDENT_STATUSES as readonly IncidentStatus[];

/** True when `to` is the same status or a forward transition. */
export function canTransitionStatus(
  from: IncidentStatus,
  to: IncidentStatus,
): boolean {
  if (from === to) return true;
  if (from === "resolved") return false;
  return ORDER.indexOf(to) > ORDER.indexOf(from);
}

/** Statuses the operator may choose from the current status. */
export function allowedNextStatuses(
  current: IncidentStatus,
): IncidentStatus[] {
  if (current === "resolved") return [];
  return ORDER.filter(
    (status) => canTransitionStatus(current, status) && status !== current,
  );
}

export function assertValidTransition(
  from: IncidentStatus,
  to: IncidentStatus,
): void {
  if (!canTransitionStatus(from, to)) {
    throw new Error(
      `Invalid status transition from "${from}" to "${to}". Allowed flow: Investigating → Identified → Monitoring → Resolved.`,
    );
  }
}
