import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Shared typed Supabase client used by services and route handlers.
 *
 * Defined against `SupabaseClient<Database>` so browser, server, and
 * service-role admin clients are assignable without `as unknown` casts.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;
