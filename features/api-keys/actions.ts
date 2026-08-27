"use server";

import { revalidatePath } from "next/cache";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  fieldErrorsFromZod,
  toLocalizedErrorMessage,
} from "@/lib/i18n/localize-action";
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

function assertUserMutationLimit(
  userId: string,
  action: string,
  limit: number,
  rateLimitedMessage: string,
) {
  const result = rateLimit(`api-keys:${action}:${userId}`, limit, 60_000);
  if (!result.allowed) {
    return {
      status: "error" as const,
      message: rateLimitedMessage,
    };
  }
  return null;
}

export async function createApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const parsed = createApiKeySchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    environment: formData.get("environment"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error, am) };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
  }

  const limited = assertUserMutationLimit(user.id, "create", 30, am.apiKeyRateLimited);
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
      message: am.apiKeyCreated,
      plainKey,
      apiKeyId: apiKey.id,
    };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function revokeApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const idResult = apiKeyIdSchema.safeParse({ id: formData.get("id") });
  if (!idResult.success) {
    return { status: "error", message: am.invalidApiKeyId };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
  }

  const limited = assertUserMutationLimit(user.id, "revoke", 30, am.apiKeyRateLimited);
  if (limited) return limited;

  try {
    await revokeApiKey(supabase, user.id, idResult.data.id);
    revalidatePath(DASHBOARD_ROUTES.apiKeys);
    return { status: "success", message: am.apiKeyRevoked };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}

export async function regenerateApiKeyAction(
  _prevState: ApiKeyFormState,
  formData: FormData,
): Promise<ApiKeyFormState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;

  const idResult = apiKeyIdSchema.safeParse({ id: formData.get("id") });
  if (!idResult.success) {
    return { status: "error", message: am.invalidApiKeyId };
  }

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { status: "error", message: am.mustSignIn };
  }

  const limited = assertUserMutationLimit(
    user.id,
    "regenerate",
    20,
    am.apiKeyRateLimited,
  );
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
      message: am.apiKeyRegenerated,
      plainKey,
      apiKeyId: apiKey.id,
    };
  } catch (error) {
    return { status: "error", message: toLocalizedErrorMessage(error, am) };
  }
}
