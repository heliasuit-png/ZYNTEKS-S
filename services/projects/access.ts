import "server-only";

import { mapPostgrestError } from "@/lib/map-postgrest-error";
import type { TypedSupabaseClient } from "@/supabase/client";

type Supabase = TypedSupabaseClient;

/**
 * Project IDs the caller may view under RLS (owner or workspace member).
 * Does not trust client-supplied IDs beyond optional workspace scoping —
 * PostgREST still applies `user_can_view_project` / project SELECT policies.
 */
export async function listAccessibleProjectIds(
  supabase: Supabase,
  options: { workspaceId?: string } = {},
): Promise<string[]> {
  let query = supabase.from("projects").select("id");
  if (options.workspaceId) {
    query = query.eq("workspace_id", options.workspaceId);
  }

  const { data, error } = await query;
  if (error) {
    throw mapPostgrestError(error);
  }
  return (data ?? []).map((row) => row.id);
}
