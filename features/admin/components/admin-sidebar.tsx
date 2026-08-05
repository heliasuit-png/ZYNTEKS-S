"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_ROUTES } from "@/lib/constants";
import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import { ADMIN_NAV_ITEMS } from "@/features/admin/nav";

interface AdminSidebarProps {
  role: AdminPlatformRole;
  open?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({
  role,
  open = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className={[
        "admin-glass fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col border-r border-[var(--admin-border)] transition-transform duration-200 ease-out",
        "lg:translate-x-0 lg:z-30",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      aria-label="Admin navigation"
    >
      <div className="flex h-[var(--admin-topbar-height)] items-center gap-3 border-b border-[var(--admin-border)] px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-sm font-semibold text-[var(--admin-accent)]"
          aria-hidden
        >
          Z
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-wide text-[var(--admin-text)]">
            ZYNTEKSIS
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Admin Center
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const allowed = hasAdminPermission(role, item.permission);
          const active =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const interactive = item.enabled && allowed;

          if (!interactive) {
            return (
              <div
                key={item.id}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--admin-muted)] opacity-45"
                title={
                  !allowed
                    ? "Insufficient permissions"
                    : "Available in a later phase"
                }
                aria-disabled="true"
              >
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={[
                "admin-accent-ring flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-2)] hover:text-[var(--admin-text)]",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--admin-border)] px-4 py-3 text-xs text-[var(--admin-muted)]">
        <Link
          href={ADMIN_ROUTES.dashboard}
          onClick={onNavigate}
          className="admin-accent-ring rounded transition-colors hover:text-[var(--admin-text)]"
        >
          Control Center
        </Link>
      </div>
    </aside>
  );
}
