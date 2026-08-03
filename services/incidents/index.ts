export {
  listIncidents,
  countOpenIncidents,
  getIncidentById,
  addIncidentUpdate,
} from "@/services/incidents/incident.service";
export type {
  ListIncidentsParams,
  AddIncidentUpdateInput,
} from "@/services/incidents/incident.service";
export {
  getOpenMonitorIncidents,
  openOutageIncident,
  resolveOutageIncident,
} from "@/services/incidents/incident.engine";
export type {
  OpenOutageInput,
  ResolveOutageInput,
} from "@/services/incidents/incident.engine";
export type {
  Incident,
  IncidentInsert,
  IncidentUpdateRow,
  IncidentWithUpdates,
} from "@/services/incidents/types";
export {
  canTransitionStatus,
  allowedNextStatuses,
  assertValidTransition,
} from "@/services/incidents/transitions";
