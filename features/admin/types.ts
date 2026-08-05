import type { AdminPermission, AdminUser } from "@/services/admin";

export type AdminFormStatus = "idle" | "error" | "success";

export interface AdminFormState {
  status: AdminFormStatus;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialAdminFormState: AdminFormState = { status: "idle" };

export interface AdminShellUser {
  email: string;
  admin: AdminUser;
  permissions: AdminPermission[];
}

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  /** Permission required to eventually use this module (Phase 1: nav visibility). */
  permission: AdminPermission;
  /** Phase 1: only dashboard is navigable. */
  enabled: boolean;
}
