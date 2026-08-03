import { z } from "zod";

import { API_KEY_ENVIRONMENTS } from "@/lib/constants";
import type { ApiKeyEnvironment } from "@/types/database";

const environmentValues = [...API_KEY_ENVIRONMENTS] as [
  ApiKeyEnvironment,
  ...ApiKeyEnvironment[],
];

export const createApiKeySchema = z.object({
  projectId: z.string().uuid("Select a project."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(60, "Name must be 60 characters or fewer."),
  environment: z.enum(environmentValues),
});

export const apiKeyIdSchema = z.object({
  id: z.string().uuid("Invalid API key id."),
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;
