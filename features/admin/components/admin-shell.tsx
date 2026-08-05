"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

import type { AdminShellUser } from "@/features/admin/types";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import type { AdminBreadcrumbItem } from "@/features/admin/components/admin-breadcrumbs";
import { ADMIN_FADE_UP } from "@/features/admin/components/ui/admin-motion";

interface AdminShellProps {
  user: AdminShellUser;
  children: ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
}

export function AdminShell({ user, children, breadcrumbs }: AdminShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-[var(--admin-bg)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%)]"
      />

      <AnimatePresence>
        {navOpen ? (
          <motion.button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNavOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AdminSidebar
        role={user.admin.role}
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
      />

      <div className="relative lg:pl-[var(--admin-sidebar-width)]">
        <AdminTopbar
          user={user}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setNavOpen((value) => !value)}
          menuOpen={navOpen}
        />
        <motion.main
          key={pathname}
          initial={ADMIN_FADE_UP.initial}
          animate={ADMIN_FADE_UP.animate}
          transition={ADMIN_FADE_UP.transition}
          className="min-h-[calc(100vh-var(--admin-topbar-height))]"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
