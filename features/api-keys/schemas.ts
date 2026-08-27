import { z } from "zod";

import { API_KEY_ENVIRONMENTS } from "@/lib/constants";
import type { ApiKeyEnvironment } from "@/types/database";

const environmentValues = [...API_KEY_ENVIRONMENTS] as [
  ApiKeyEnvironment,
  ...ApiKeyEnvironment[],
];

export const createApiKeySchema = z.object({
  projectId: z.string().uuid("select_project"),
  name: z
    .string()
    .trim()
    .min(1, "name_required")
    .max(60, "name_max_60"),
  environment: z.enum(environmentValues),
});

export const apiKeyIdSchema = z.object({
  id: z.string().uuid("invalid_api_key_id"),
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;
