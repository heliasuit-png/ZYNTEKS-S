import type { WorkspaceRole } from "@/types/database";

/** Minimal, serializable user shape passed from the server layout to the shell. */
export interface DashboardUser {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
}

export interface DashboardWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  role: WorkspaceRole;
  memberCount: number;
  projectCount: number;
  brandColor: string;
}

export interface DashboardWorkspaceContext {
  active: DashboardWorkspace;
  workspaces: DashboardWorkspace[];
}
