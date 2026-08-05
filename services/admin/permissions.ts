import { ForbiddenError } from "@/lib/errors";
import type { AdminPlatformRole } from "@/types/database";

import type { AdminPermission } from "@/services/admin/types";

/**
 * Enterprise Admin Control Center RBAC matrix.
 * Unknown / missing roles deny by default.
 */

const ALL_EXCEPT_PLATFORM_DELETE: AdminPermission[] = [
  "admin:access",
  "admin:dashboard",
  "admin:users:read",
  "admin:users:write",
  "admin:users:reset_password",
  "admin:workspaces:read",
  "admin:workspaces:write",
  "admin:projects:read",
  "admin:monitoring:read",
  "admin:api_keys:read",
  "admin:analytics:read",
  "admin:ai:read",
  "admin:notifications:read",
  "admin:security:read",
  "admin:audit:read",
  "admin:settings:read",
  "admin:settings:write",
];

const SUPER_ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  ...ALL_EXCEPT_PLATFORM_DELETE,
  "admin:platform:delete",
];

const ROLE_PERMISSIONS: Record<AdminPlatformRole, readonly AdminPermission[]> =
  {
    SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
    ADMIN: ALL_EXCEPT_PLATFORM_DELETE,
    SUPPORT: [
      "admin:access",
      "admin:dashboard",
      "admin:users:read",
      "admin:users:reset_password",
      "admin:workspaces:read",
      "admin:projects:read",
      "admin:monitoring:read",
      "admin:audit:read",
    ],
    READ_ONLY: ["admin:access", "admin:dashboard"],
  };

export function permissionsForAdminRole(
  role: AdminPlatformRole,
): AdminPermission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasAdminPermission(
  role: AdminPlatformRole | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!role) return false;
  return permissionsForAdminRole(role).includes(permission);
}

export function assertAdminPermission(
  role: AdminPlatformRole | null | undefined,
  permission: AdminPermission,
): void {
  if (!hasAdminPermission(role, permission)) {
    throw new ForbiddenError(`Missing admin permission: ${permission}`);
  }
}
