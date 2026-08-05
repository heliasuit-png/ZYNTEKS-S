import "server-only";

import { redirect } from "next/navigation";

import { ADMIN_ROUTES, ROUTES } from "@/lib/constants";
import {
  getAdminUserByAuthId,
  permissionsForAdminRole,
} from "@/services/admin";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { AdminShellUser } from "@/features/admin/types";

export async function requireAdminSession(): Promise<AdminShellUser> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) {
    redirect(ADMIN_ROUTES.login);
  }

  const admin = await getAdminUserByAuthId(supabase, user.id);
  if (!admin) {
    redirect(ROUTES.home);
  }

  return {
    email: user.email ?? "",
    admin,
    permissions: permissionsForAdminRole(admin.role),
  };
}

/** For the login page: if already an admin, go to dashboard; if signed in but not admin, home. */
export async function redirectIfAdminSession(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return;
  }

  const admin = await getAdminUserByAuthId(supabase, user.id);
  if (admin) {
    redirect(ADMIN_ROUTES.dashboard);
  }
  redirect(ROUTES.home);
}
