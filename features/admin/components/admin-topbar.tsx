"use client";

import { usePathname } from "next/navigation";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";
import type { AdminPlatformRole } from "@/services/admin/types";
import type { AdminShellUser } from "@/features/admin/types";
import { adminSignOutAction } from "@/features/admin/actions";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";
import type { AdminBreadcrumbItem } from "@/features/admin/components/admin-breadcrumbs";
import { resolveAdminNav } from "@/features/admin/nav";

interface AdminTopbarProps {
  user: AdminShellUser;
  breadcrumbs?: AdminBreadcrumbItem[];
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

const ROLE_DICT_KEY: Record<
  AdminPlatformRole,
  keyof AdminDictionary["roles"]
> = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SUPPORT: "support",
  READ_ONLY: "read_only",
};

function breadcrumbsFromPath(
  pathname: string,
  labels: {
    home: string;
    console: string;
  },
  navLabels: AdminDictionary["nav"],
): AdminBreadcrumbItem[] {
  const items = resolveAdminNav(navLabels);
  const match = items.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (match) {
    return [{ label: match.label }];
  }
  if (pathname === ADMIN_ROUTES.root) {
    return [{ label: labels.home }];
  }
  return [{ label: labels.console }];
}

export function AdminTopbar({
  user,
  breadcrumbs,
  onMenuClick,
  menuOpen = false,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const { dict } = useDictionary();
  const shell = dict.admin.shell;
  const items =
    breadcrumbs ??
    breadcrumbsFromPath(
      pathname,
      { home: shell.home, console: shell.console },
      dict.admin.nav,
    );
  const roleLabel = dict.admin.roles[ROLE_DICT_KEY[user.admin.role]];

  return (
    <header className="sticky top-0 z-20 flex h-[var(--admin-topbar-height)] items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[rgba(5,7,12,0.82)] px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="admin-accent-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] lg:hidden"
          aria-label={menuOpen ? shell.closeMenu : shell.openMenu}
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
            {roleLabel}
          </p>
        </div>
        <form action={adminSignOutAction}>
          <button
            type="submit"
            className="admin-accent-ring rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-medium text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
          >
            {shell.signOut}
          </button>
        </form>
      </div>
    </header>
  );
}
