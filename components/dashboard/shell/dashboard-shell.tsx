"use client";

import type { ReactNode } from "react";

import { DashboardProvider } from "@/features/dashboard/context/dashboard-context";
import { AuroraBackground } from "@/components/dashboard/shell/aurora-background";
import { CommandPaletteProvider } from "@/components/dashboard/command-palette/command-palette-context";
import { CommandPalette } from "@/components/dashboard/command-palette/command-palette";
import { GlobalShortcuts } from "@/components/dashboard/shell/global-shortcuts";
import { Sidebar } from "@/components/dashboard/shell/sidebar";
import { MobileNav } from "@/components/dashboard/shell/mobile-nav";
import { Topbar } from "@/components/dashboard/shell/topbar";
import type {
  DashboardUser,
  DashboardWorkspaceContext,
} from "@/features/dashboard/types";
import type { NotificationItem } from "@/types/dashboard";

interface DashboardShellProps {
  user: DashboardUser;
  workspace: DashboardWorkspaceContext;
  unreadCount: number;
  notifications: NotificationItem[];
  children: ReactNode;
}

export function DashboardShell({
  user,
  workspace,
  unreadCount,
  notifications,
  children,
}: DashboardShellProps) {
  return (
    <DashboardProvider>
      <CommandPaletteProvider>
        <AuroraBackground />
        <div className="min-h-screen text-zt-text">
          <div className="flex">
            <Sidebar user={user} workspace={workspace} />
            <MobileNav user={user} workspace={workspace} />
            <div className="flex min-h-screen w-full min-w-0 flex-col">
              <Topbar
                user={user}
                unreadCount={unreadCount}
                notifications={notifications}
                workspace={workspace}
              />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </div>
        <CommandPalette workspaceId={workspace.active.id} />
        <GlobalShortcuts />
      </CommandPaletteProvider>
    </DashboardProvider>
  );
}
