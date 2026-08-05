"use client";

import { usePathname } from "next/navigation";

import { ADMIN_ROUTES } from "@/lib/constants";
import { ADMIN_PLATFORM_ROLE_LABELS } from "@/services/admin/types";
import type { AdminShellUser } from "@/features/admin/types";
import { adminSignOutAction } from "@/features/admin/actions";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";
import type { AdminBreadcrumbItem } from "@/features/admin/components/admin-breadcrumbs";
import { ADMIN_NAV_ITEMS } from "@/features/admin/nav";

interface AdminTopbarProps {
  user: AdminShellUser;
  breadcrumbs?: AdminBreadcrumbItem[];
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

function breadcrumbsFromPath(pathname: string): AdminBreadcrumbItem[] {
  const match = ADMIN_NAV_ITEMS.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (match) {
    return [{ label: match.label }];
  }
  if (pathname === ADMIN_ROUTES.root) {
    return [{ label: "Home" }];
  }
  return [{ label: "Console" }];
}

export function AdminTopbar({
  user,
  breadcrumbs,
  onMenuClick,
  menuOpen = false,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const items = breadcrumbs ?? breadcrumbsFromPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[var(--admin-topbar-height)] items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[rgba(5,7,12,0.82)] px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="admin-accent-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={onMenuClick}
        >
          <span aria-hidden className="text-base leading-none">
            {menuOpen ? "✕" : "☰"}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <AdminBreadcrumbs items={items} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="truncate text-sm font-medium text-[var(--admin-text)]">
            {user.email}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
            {ADMIN_PLATFORM_ROLE_LABELS[user.admin.role]}
          </p>
        </div>
        <form action={adminSignOutAction}>
          <button
            type="submit"
            className="admin-accent-ring rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-medium text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
