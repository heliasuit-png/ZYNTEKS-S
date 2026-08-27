import { z } from "zod";

import { PROJECT_FRAMEWORKS, PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectFramework, ProjectStatus } from "@/types/database";

const frameworkValues = [...PROJECT_FRAMEWORKS] as [
  ProjectFramework,
  ...ProjectFramework[],
];
const statusValues = [...PROJECT_STATUSES] as [
  ProjectStatus,
  ...ProjectStatus[],
];

const optionalText = (max: number, code: string) =>
  z
    .string()
    .trim()
    .max(max, code)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("invalid_url")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const nameField = z
  .string()
  .trim()
  .min(1, "name_required")
  .max(80, "name_max_80");

export const createProjectSchema = z.object({
  name: nameField,
  slug: z
    .string()
    .trim()
    .max(80, "slug_max_80")
    .optional(),
  description: optionalText(500, "description_max_500"),
  framework: z.enum(frameworkValues),
  productionUrl: optionalUrl,
  stagingUrl: optionalUrl,
});

export const updateProjectSchema = z.object({
  name: nameField,
  description: optionalText(500, "description_max_500"),
  framework: z.enum(frameworkValues),
  status: z.enum(statusValues),
  productionUrl: optionalUrl,
  stagingUrl: optionalUrl,
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
