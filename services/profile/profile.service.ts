import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database } from "@/types/database";

/**
 * User profile service. Reads and updates the `profiles` table created by the
 * SQL migrations. All access is subject to Row Level Security.
 */

type Supabase = TypedSupabaseClient;

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function getProfileById(
  supabase: Supabase,
  userId: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }

  if (!data) {
    throw new NotFoundError("Profile not found");
  }

  return data;
}

export async function updateProfile(
  supabase: Supabase,
  userId: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }

  return data;
}
