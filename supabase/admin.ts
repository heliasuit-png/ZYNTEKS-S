import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { TypedSupabaseClient } from "@/supabase/types";
import type { Database } from "@/types/database";

/**
 * Creates a privileged Supabase client using the service role key. This
 * bypasses Row Level Security and must NEVER be imported into client code.
 */
export function createSupabaseAdminClient(): TypedSupabaseClient {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
