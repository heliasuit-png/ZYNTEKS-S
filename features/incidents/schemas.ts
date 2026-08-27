import { z } from "zod";

import { INCIDENT_STATUSES } from "@/lib/constants";
import type { IncidentStatus } from "@/types/database";

const statusValues = [...INCIDENT_STATUSES] as [
  IncidentStatus,
  ...IncidentStatus[],
];

export const addIncidentUpdateSchema = z.object({
  incidentId: z.string().uuid("invalid_incident_id"),
  message: z
    .string()
    .trim()
    .min(1, "message_required")
    .max(2000, "message_max_2000"),
  status: z.enum(statusValues).optional(),
});

export type AddIncidentUpdateValues = z.infer<typeof addIncidentUpdateSchema>;
