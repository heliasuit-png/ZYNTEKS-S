import type { Database } from "@/types/database";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentInsert =
  Database["public"]["Tables"]["incidents"]["Insert"];
export type IncidentUpdateRow =
  Database["public"]["Tables"]["incident_updates"]["Row"];

export interface IncidentWithUpdates {
  incident: Incident;
  updates: IncidentUpdateRow[];
}
