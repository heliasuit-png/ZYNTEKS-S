"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import {
  createApiKey,
  regenerateApiKey,
  revokeApiKey,
} from "@/services/api-keys";
import {
  apiKeyIdSchema,
  createApiKeySchema,
} from "@/features/api-keys/schemas";
import type { ApiKeyFormState } from "@/features/api-keys/types";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      result[key] = messages;
    }
  }
  return result;
}

function toErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function assertUserMutationLimit(userId: string, action: string, limit: number) {
  const result = rateLimit(`api-keys:${action}:${userId}`, limit, 60_000);
  if (!result.allowed) {
    return {
      status: "error" as const,
      message: "Too many API key operations. Please try again shortly.",
    };
  }
  return null;
}

export async function createApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const parsed = createApiKeySchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    environment: formData.get("environment"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const limited = assertUserMutationLimit(user.id, "create", 30);
  if (limited) return limited;

  try {
    const { apiKey, plainKey } = await createApiKey(supabase, user.id, {
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      environment: parsed.data.environment,
    });
    revalidatePath(DASHBOARD_ROUTES.apiKeys);
    return {
      status: "success",
      message: "API key created.",
      plainKey,
      apiKeyId: apiKey.id,
    };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function revokeApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const idResult = apiKeyIdSchema.safeParse({ id: formData.get("id") });
  if (!idResult.success) {
    return { status: "error", message: "Invalid API key id." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const limited = assertUserMutationLimit(user.id, "revoke", 30);
  if (limited) return limited;

  try {
    await revokeApiKey(supabase, user.id, idResult.data.id);
    revalidatePath(DASHBOARD_ROUTES.apiKeys);
    return { status: "success", message: "API key revoked." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

export async function regenerateApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const idResult = apiKeyIdSchema.safeParse({ id: formData.get("id") });
  if (!idResult.success) {
    return { status: "error", message: "Invalid API key id." };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  const limited = assertUserMutationLimit(user.id, "regenerate", 20);
  if (limited) return limited;

  try {
    const { apiKey, plainKey } = await regenerateApiKey(
      supabase,
      user.id,
      idResult.data.id,
    );
    revalidatePath(DASHBOARD_ROUTES.apiKeys);
    return {
      status: "success",
      message: "API key regenerated.",
      plainKey,
      apiKeyId: apiKey.id,
    };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
