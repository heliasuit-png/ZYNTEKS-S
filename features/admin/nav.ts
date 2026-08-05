import { ADMIN_ROUTES } from "@/lib/constants";

import type { AdminNavItem } from "@/features/admin/types";

/** Sidebar definition — Admin Control Center modules (Audit enabled in Phase 10). */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ADMIN_ROUTES.dashboard,
    permission: "admin:dashboard",
    enabled: true,
  },
  {
    id: "users",
    label: "Users",
    href: ADMIN_ROUTES.users,
    permission: "admin:users:read",
    enabled: true,
  },
  {
    id: "workspaces",
    label: "Workspaces",
    href: ADMIN_ROUTES.workspaces,
    permission: "admin:workspaces:read",
    enabled: true,
  },
  {
    id: "projects",
    label: "Projects",
    href: ADMIN_ROUTES.projects,
    permission: "admin:projects:read",
    enabled: false,
  },
  {
    id: "monitoring",
    label: "Monitoring",
    href: ADMIN_ROUTES.monitoring,
    permission: "admin:monitoring:read",
    enabled: true,
  },
  {
    id: "api-keys",
    label: "API Keys",
    href: ADMIN_ROUTES.apiKeys,
    permission: "admin:api_keys:read",
    enabled: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: ADMIN_ROUTES.analytics,
    permission: "admin:analytics:read",
    enabled: true,
  },
  {
    id: "ai",
    label: "AI",
    href: ADMIN_ROUTES.ai,
    permission: "admin:ai:read",
    enabled: true,
  },
  {
    id: "notifications",
    label: "Notifications",
    href: ADMIN_ROUTES.notifications,
    permission: "admin:notifications:read",
    enabled: false,
  },
  {
    id: "security",
    label: "Security",
    href: ADMIN_ROUTES.security,
    permission: "admin:security:read",
    enabled: true,
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    href: ADMIN_ROUTES.auditLogs,
    permission: "admin:audit:read",
    enabled: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: ADMIN_ROUTES.settings,
    permission: "admin:settings:read",
    enabled: true,
  },
] as const;
