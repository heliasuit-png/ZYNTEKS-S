import "server-only";

import { mapPostgrestError } from "@/lib/map-postgrest-error";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database } from "@/types/database";

import type { AdminUser } from "@/services/admin/types";

type Supabase = TypedSupabaseClient;
type AdminUserRow = Database["public"]["Tables"]["admin_users"]["Row"];

function mapRow(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login,
  };
}

/** Returns the platform admin membership for an auth user, or null. */
export async function getAdminUserByAuthId(
  supabase: Supabase,
  userId: string,
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    return null;
  }
  return mapRow(data);
}

/** Stamps last_login for the authenticated admin (own row only via RLS). */
export async function touchAdminLastLogin(
  supabase: Supabase,
  userId: string,
): Promise<AdminUser> {
  const { data, error } = await supabase
    .from("admin_users")
    .update({ last_login: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }
  return mapRow(data);
}
