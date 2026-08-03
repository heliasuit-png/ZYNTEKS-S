import { z } from "zod";

import { INCIDENT_STATUSES } from "@/lib/constants";
import type { IncidentStatus } from "@/types/database";

const statusValues = [...INCIDENT_STATUSES] as [
  IncidentStatus,
  ...IncidentStatus[],
];

export const addIncidentUpdateSchema = z.object({
  incidentId: z.string().uuid("Invalid incident id."),
  message: z
    .string()
    .trim()
    .min(1, "A message is required.")
    .max(2000, "Message must be 2000 characters or fewer."),
  status: z.enum(statusValues).optional(),
});

export type AddIncidentUpdateValues = z.infer<typeof addIncidentUpdateSchema>;
