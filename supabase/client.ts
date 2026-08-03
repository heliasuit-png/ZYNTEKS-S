import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export type { TypedSupabaseClient } from "@/supabase/types";

/**
 * Creates a Supabase client for use in Client Components. Safe to call in the
 * browser; only the public anon key is used.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
