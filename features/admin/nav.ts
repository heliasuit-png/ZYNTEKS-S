import { ADMIN_ROUTES } from "@/lib/constants";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { AdminDictionary } from "@/lib/i18n/dictionaries/admin-types";

import type { AdminNavItem, AdminNavItemDef } from "@/features/admin/types";

/** Sidebar definition — Admin Control Center modules (Audit enabled in Phase 10). */
export const ADMIN_NAV_ITEM_DEFS: readonly AdminNavItemDef[] = [
  {
    id: "dashboard",
    key: "dashboard",
    href: ADMIN_ROUTES.dashboard,
    permission: "admin:dashboard",
    enabled: true,
  },
  {
    id: "users",
    key: "users",
    href: ADMIN_ROUTES.users,
    permission: "admin:users:read",
    enabled: true,
  },
  {
    id: "workspaces",
    key: "workspaces",
    href: ADMIN_ROUTES.workspaces,
    permission: "admin:workspaces:read",
    enabled: true,
  },
  {
    id: "projects",
    key: "projects",
    href: ADMIN_ROUTES.projects,
    permission: "admin:projects:read",
    enabled: false,
  },
  {
    id: "monitoring",
    key: "monitoring",
    href: ADMIN_ROUTES.monitoring,
    permission: "admin:monitoring:read",
    enabled: true,
  },
  {
    id: "api-keys",
    key: "apiKeys",
    href: ADMIN_ROUTES.apiKeys,
    permission: "admin:api_keys:read",
    enabled: false,
  },
  {
    id: "analytics",
    key: "analytics",
    href: ADMIN_ROUTES.analytics,
    permission: "admin:analytics:read",
    enabled: true,
  },
  {
    id: "ai",
    key: "ai",
    href: ADMIN_ROUTES.ai,
    permission: "admin:ai:read",
    enabled: true,
  },
  {
    id: "notifications",
    key: "notifications",
    href: ADMIN_ROUTES.notifications,
    permission: "admin:notifications:read",
    enabled: false,
  },
  {
    id: "security",
    key: "security",
    href: ADMIN_ROUTES.security,
    permission: "admin:security:read",
    enabled: true,
  },
  {
    id: "audit-logs",
    key: "audit",
    href: ADMIN_ROUTES.auditLogs,
    permission: "admin:audit:read",
    enabled: true,
  },
  {
    id: "settings",
    key: "settings",
    href: ADMIN_ROUTES.settings,
    permission: "admin:settings:read",
    enabled: true,
  },
] as const;

export function resolveAdminNav(
  labels: AdminDictionary["nav"],
): AdminNavItem[] {
  return ADMIN_NAV_ITEM_DEFS.map((item) => ({
    ...item,
    label: labels[item.key],
  }));
}

/**
 * English fallback for client modules that mount before labels are injected.
 * Runtime navigation should use `resolveAdminNav(dict.admin.nav)`.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = resolveAdminNav(
  dictionaries.en.admin.nav,
);
