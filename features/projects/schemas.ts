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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Enter a valid URL.")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name must be 80 characters or fewer.");

export const createProjectSchema = z.object({
  name: nameField,
  slug: z
    .string()
    .trim()
    .max(80, "Slug must be 80 characters or fewer.")
    .optional(),
  description: optionalText(500),
  framework: z.enum(frameworkValues),
  productionUrl: optionalUrl,
  stagingUrl: optionalUrl,
});

export const updateProjectSchema = z.object({
  name: nameField,
  description: optionalText(500),
  framework: z.enum(frameworkValues),
  status: z.enum(statusValues),
  productionUrl: optionalUrl,
  stagingUrl: optionalUrl,
});

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
