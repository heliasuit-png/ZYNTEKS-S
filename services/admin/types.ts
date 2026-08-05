import type { AdminPlatformRole } from "@/types/database";

export type { AdminPlatformRole };

export type AdminPermission =
  | "admin:access"
  | "admin:dashboard"
  | "admin:users:read"
  | "admin:users:write"
  | "admin:users:reset_password"
  | "admin:workspaces:read"
  | "admin:workspaces:write"
  | "admin:projects:read"
  | "admin:monitoring:read"
  | "admin:api_keys:read"
  | "admin:analytics:read"
  | "admin:ai:read"
  | "admin:notifications:read"
  | "admin:security:read"
  | "admin:audit:read"
  | "admin:settings:read"
  | "admin:settings:write"
  | "admin:platform:delete";

export interface AdminUser {
  id: string;
  userId: string;
  role: AdminPlatformRole;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export const ADMIN_PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUPPORT",
  "READ_ONLY",
] as const satisfies readonly AdminPlatformRole[];

export const ADMIN_PLATFORM_ROLE_LABELS: Record<AdminPlatformRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SUPPORT: "Support",
  READ_ONLY: "Read Only",
};
