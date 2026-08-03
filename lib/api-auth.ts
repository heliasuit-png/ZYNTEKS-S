import type { User } from "@supabase/supabase-js";

import { UnauthorizedError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { TypedSupabaseClient } from "@/supabase/client";

export interface ApiAuthContext {
  supabase: TypedSupabaseClient;
  user: User;
}

/**
 * Resolves the authenticated user for a route handler or throws an
 * {@link UnauthorizedError} (translated to a 401 response by the API layer).
 */
export async function requireApiUser(): Promise<ApiAuthContext> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new UnauthorizedError("Authentication required.");
  }
  return { supabase, user };
}

/** Parses a query-string integer, returning undefined when not a valid number. */
export function parseIntParam(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
