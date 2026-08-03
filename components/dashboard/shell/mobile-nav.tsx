"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Brand } from "@/components/dashboard/shell/brand";
import { NavList } from "@/components/dashboard/shell/nav-list";
import { WorkspaceSwitcher } from "@/components/dashboard/shell/workspace-switcher";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type {
  DashboardUser,
  DashboardWorkspaceContext,
} from "@/features/dashboard/types";

export function MobileNav({
  user,
  workspace,
}: {
  user: DashboardUser;
  workspace: DashboardWorkspaceContext;
}) {
  const { isMobileNavOpen, closeMobileNav } = useDashboard();
  const displayName = user.fullName?.trim() || user.email;

  return (
    <AnimatePresence>
      {isMobileNavOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeMobileNav}
          />
          <motion.aside
            className="zt-glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zt-border lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-16 items-center justify-between border-b border-zt-border px-5">
              <Brand />
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close navigation"
                className="rounded-lg p-1 text-zt-muted transition-colors hover:text-zt-text"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="border-b border-zt-border py-3">
              <WorkspaceSwitcher workspace={workspace} />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList onNavigate={closeMobileNav} />
            </div>
            <div className="flex items-center gap-3 border-t border-zt-border px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zt-primary to-zt-secondary text-xs font-semibold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
              <p className="min-w-0 truncate text-sm text-zt-text">
                {displayName}
              </p>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
