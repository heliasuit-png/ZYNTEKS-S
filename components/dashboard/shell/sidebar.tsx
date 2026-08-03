"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Brand } from "@/components/dashboard/shell/brand";
import { NavList } from "@/components/dashboard/shell/nav-list";
import { WorkspaceSwitcher } from "@/components/dashboard/shell/workspace-switcher";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type {
  DashboardUser,
  DashboardWorkspaceContext,
} from "@/features/dashboard/types";

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

function getInitials(user: DashboardUser): string {
  const source = user.fullName?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Sidebar({
  user,
  workspace,
}: {
  user: DashboardUser;
  workspace: DashboardWorkspaceContext;
}) {
  const { isSidebarCollapsed, toggleSidebar } = useDashboard();
  const collapsed = isSidebarCollapsed;
  const displayName = user.fullName?.trim() || user.email;
  const planLabel = PLAN_LABELS[user.plan] ?? user.plan;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 p-3 lg:block",
        collapsed ? "w-[84px]" : "w-[264px]",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
    >
      <div className="zt-glass-strong flex h-full flex-col rounded-2xl border border-zt-border shadow-2xl shadow-black/40">
        <div
          className={cn(
            "flex h-16 items-center px-4",
            collapsed && "justify-center px-0",
          )}
        >
          <Brand collapsed={collapsed} />
        </div>

        <WorkspaceSwitcher workspace={workspace} collapsed={collapsed} />

        <div className="mt-2 flex-1 overflow-y-auto px-3 py-2">
          <NavList collapsed={collapsed} />
        </div>

        <div className={cn("border-t border-zt-border p-3", collapsed && "px-2")}>
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-white/[0.02] p-2",
              collapsed && "justify-center bg-transparent p-0",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zt-primary to-zt-secondary text-xs font-semibold text-white shadow-md shadow-zt-primary/30">
              {getInitials(user)}
            </span>
            {collapsed ? null : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zt-text">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-zt-muted">
                  {workspace.active.role.replace("_", " ")} · {planLabel}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className={cn(
              "mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-zt-border py-1.5 text-xs text-zt-muted transition-colors hover:border-zt-border-strong hover:text-zt-text",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" aria-hidden />
            ) : (
              <>
                <ChevronsLeft className="size-4" aria-hidden />
                Collapse
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
