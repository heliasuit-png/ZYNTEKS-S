"use client";

import Link from "next/link";
import { Menu, Sparkles, Users } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { SearchBox } from "@/components/dashboard/shell/search-box";
import { Breadcrumbs } from "@/components/dashboard/shell/breadcrumbs";
import { AppearanceMenu } from "@/components/dashboard/shell/appearance-menu";
import { NotificationsButton } from "@/components/dashboard/shell/notifications-button";
import { UserDropdown } from "@/components/dashboard/shell/user-dropdown";
import type {
  DashboardUser,
  DashboardWorkspaceContext,
} from "@/features/dashboard/types";
import type { NotificationItem } from "@/types/dashboard";

interface TopbarProps {
  user: DashboardUser;
  workspace: DashboardWorkspaceContext;
  unreadCount: number;
  notifications: NotificationItem[];
}

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function Topbar({
  user,
  workspace,
  unreadCount,
  notifications,
}: TopbarProps) {
  const { openMobileNav } = useDashboard();
  const planLabel = PLAN_LABELS[workspace.active.plan] ?? workspace.active.plan;

  return (
    <header className="zt-glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zt-border px-4 lg:px-8">
      <button
        type="button"
        onClick={openMobileNav}
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-xl border border-zt-border bg-white/[0.02] text-zt-muted transition-colors hover:text-zt-text lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Breadcrumb navigation */}
      <Breadcrumbs />

      <div className="flex flex-1 items-center justify-center px-2">
        <SearchBox />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={DASHBOARD_ROUTES.members}
          className="hidden items-center gap-1.5 rounded-full border border-zt-border bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text md:flex"
        >
          <Users className="size-3.5" aria-hidden />
          {workspace.active.memberCount} members
        </Link>
        <Link
          href={DASHBOARD_ROUTES.billing}
          className="hidden items-center gap-1.5 rounded-full border border-zt-primary/30 bg-gradient-to-r from-zt-primary/15 to-zt-secondary/15 px-3 py-1.5 text-xs font-medium text-zt-primary transition-colors hover:border-zt-primary/50 sm:flex"
        >
          <Sparkles className="size-3.5" aria-hidden />
          {planLabel}
        </Link>
        <AppearanceMenu />
        <NotificationsButton
          unreadCount={unreadCount}
          notifications={notifications}
        />
        <UserDropdown user={user} />
      </div>
    </header>
  );
}
