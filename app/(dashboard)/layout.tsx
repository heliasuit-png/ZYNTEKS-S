import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getAdminUserByAuthId } from "@/services/admin/admin-user.service";
import { getPlatformRuntimeSettings } from "@/services/platform/runtime-settings.service";
import { getProfileById } from "@/services/profile";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from "@/services/dashboard";
import {
  resolveActiveWorkspace,
  touchMemberActivity,
  touchSession,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { AppearanceBootstrap } from "@/features/settings/components/appearance-bootstrap";
import { parsePreferences } from "@/features/settings/lib/preferences";
import type { AppearancePreferences } from "@/features/settings/types";
import type {
  DashboardUser,
  DashboardWorkspaceContext,
} from "@/features/dashboard/types";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  // Server-side session validation for the entire dashboard segment.
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const platform = await getPlatformRuntimeSettings();
  if (platform.maintenanceEnabled) {
    const adminUser = await getAdminUserByAuthId(supabase, user.id);
    if (!adminUser) {
      redirect(ROUTES.maintenance);
    }
  }

  const dashboardUser: DashboardUser = {
    email: user.email ?? "",
    fullName: null,
    avatarUrl: null,
    role: "user",
    plan: "free",
  };

  let appearance: AppearancePreferences | null = null;

  try {
    const profile = await getProfileById(supabase, user.id);
    dashboardUser.fullName = profile.full_name;
    dashboardUser.avatarUrl = profile.avatar_url;
    dashboardUser.role = profile.role;
    dashboardUser.plan = profile.subscription_plan;
    appearance = parsePreferences(profile.preferences).appearance;
  } catch {
    // Profile row not available yet; fall back to the auth user defaults.
  }

  const { active, workspaces } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
    dashboardUser.fullName,
  );

  const workspaceContext: DashboardWorkspaceContext = {
    active: {
      id: active.id,
      name: active.name,
      slug: active.slug,
      logoUrl: active.logo_url,
      plan: active.plan,
      role: active.role,
      memberCount: active.memberCount,
      projectCount: active.projectCount,
      brandColor: active.brand_color,
    },
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      logoUrl: w.logo_url,
      plan: w.plan,
      role: w.role,
      memberCount: w.memberCount,
      projectCount: w.projectCount,
      brandColor: w.brand_color,
    })),
  };

  // Prefer workspace plan for shell badge when available.
  dashboardUser.plan = active.plan;

  // Best-effort session + activity tracking (does not alter auth flows).
  try {
    const headerStore = await headers();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await touchSession(supabase, {
        userId: user.id,
        accessToken: session.access_token,
        userAgent: headerStore.get("user-agent"),
        ipAddress:
          headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        country: headerStore.get("x-vercel-ip-country"),
      });
    }
    await touchMemberActivity(supabase, active.id, user.id);
  } catch {
    // Non-blocking.
  }

  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(5),
    getUnreadNotificationCount(),
  ]);

  return (
    <>
      <AppearanceBootstrap preferences={appearance} />
      <DashboardShell
        user={dashboardUser}
        workspace={workspaceContext}
        unreadCount={unreadCount}
        notifications={notifications}
      >
        {children}
      </DashboardShell>
    </>
  );
}
