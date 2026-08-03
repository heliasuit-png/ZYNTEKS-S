import type { WorkspaceRole } from "@/types/database";

/**
 * Enterprise RBAC permission matrix.
 *
 * Role → permission grants are the source of truth for workspace authorization.
 * Unknown roles deny by default (safe for future custom roles).
 * Maintainer overview: docs/Workspace.md.
 */

export type Permission =
  | "workspace:read"
  | "workspace:update"
  | "workspace:delete"
  | "workspace:transfer"
  | "members:read"
  | "members:invite"
  | "members:remove"
  | "members:suspend"
  | "members:change_role"
  | "projects:read"
  | "projects:create"
  | "projects:update"
  | "projects:delete"
  | "api_keys:read"
  | "api_keys:manage"
  | "billing:read"
  | "billing:manage"
  | "ai:use"
  | "notifications:read"
  | "notifications:manage"
  | "audit:read"
  | "security:read"
  | "security:manage"
  | "settings:manage";

const ALL: Permission[] = [
  "workspace:read",
  "workspace:update",
  "workspace:delete",
  "workspace:transfer",
  "members:read",
  "members:invite",
  "members:remove",
  "members:suspend",
  "members:change_role",
  "projects:read",
  "projects:create",
  "projects:update",
  "projects:delete",
  "api_keys:read",
  "api_keys:manage",
  "billing:read",
  "billing:manage",
  "ai:use",
  "notifications:read",
  "notifications:manage",
  "audit:read",
  "security:read",
  "security:manage",
  "settings:manage",
];

const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly Permission[]> = {
  owner: ALL,
  administrator: ALL.filter(
    (p) => p !== "workspace:delete" && p !== "workspace:transfer",
  ),
  developer: [
    "workspace:read",
    "members:read",
    "projects:read",
    "projects:create",
    "projects:update",
    "api_keys:read",
    "api_keys:manage",
    "ai:use",
    "notifications:read",
    "notifications:manage",
    "audit:read",
    "security:read",
  ],
  viewer: [
    "workspace:read",
    "members:read",
    "projects:read",
    "api_keys:read",
    "notifications:read",
    "audit:read",
    "security:read",
  ],
  billing_manager: [
    "workspace:read",
    "members:read",
    "projects:read",
    "billing:read",
    "billing:manage",
    "notifications:read",
    "audit:read",
    "security:read",
  ],
};

export function permissionsForRole(role: WorkspaceRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function hasPermission(
  role: WorkspaceRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return permissionsForRole(role).includes(permission);
}

export function assertPermission(
  role: WorkspaceRole | null | undefined,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}

/** Roles that can be assigned via invitation (owner is transfer-only). */
export const ASSIGNABLE_ROLES: WorkspaceRole[] = [
  "administrator",
  "developer",
  "viewer",
  "billing_manager",
];
