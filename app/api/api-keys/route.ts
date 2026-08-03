import type { NextRequest } from "next/server";

import { created, ok, withErrorHandling } from "@/lib/api-response";
import { parseIntParam, requireApiUser } from "@/lib/api-auth";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { API_KEY_ENVIRONMENTS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { createApiKey, listApiKeys } from "@/services/api-keys";
import { createApiKeySchema } from "@/features/api-keys/schemas";
import type { ApiKeyStatus } from "@/types/database";

const API_KEY_STATUS_VALUES: readonly ApiKeyStatus[] = ["active", "revoked"];

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireApiUser();
  const { searchParams } = new URL(request.url);

  const environmentParam = searchParams.get("environment");
  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === environmentParam,
  );
  const statusParam = searchParams.get("status");
  const status = API_KEY_STATUS_VALUES.find((value) => value === statusParam);

  const page = await listApiKeys(supabase, user.id, {
    projectId: searchParams.get("projectId") ?? undefined,
    environment,
    status,
    search: searchParams.get("search") ?? undefined,
    page: parseIntParam(searchParams.get("page")),
    pageSize: parseIntParam(searchParams.get("pageSize")),
  });

  return ok(page);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireApiUser();
  const limit = rateLimit(`api-keys:create:${user.id}`, 30, 60_000);
  if (!limit.allowed) {
    throw new RateLimitError("Too many API key create requests.");
  }
  const body = (await request.json().catch(() => null)) as unknown;

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid API key payload.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const result = await createApiKey(supabase, user.id, {
    projectId: parsed.data.projectId,
    name: parsed.data.name,
    environment: parsed.data.environment,
  });

  return created(result);
});
