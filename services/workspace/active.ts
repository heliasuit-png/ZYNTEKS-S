import "server-only";

import { cookies } from "next/headers";

import {
  ensureUserWorkspaces,
  getMembership,
  listWorkspaceSummaries,
  type WorkspaceSummary,
} from "@/services/workspace/workspace.service";
import type { TypedSupabaseClient } from "@/supabase/client";

export const WORKSPACE_COOKIE = "zt_workspace_id";

export async function resolveActiveWorkspace(
  supabase: TypedSupabaseClient,
  userId: string,
  email?: string | null,
  fullName?: string | null,
): Promise<{
  active: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
}> {
  await ensureUserWorkspaces(supabase, userId, email, fullName);
  const workspaces = await listWorkspaceSummaries(supabase, userId);
  if (workspaces.length === 0) {
    throw new Error("Failed to provision a workspace for the user.");
  }

  const cookieStore = await cookies();
  const preferred = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const active =
    workspaces.find((w) => w.id === preferred) ?? workspaces[0]!;

  return { active, workspaces };
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function assertActiveMembership(
  supabase: TypedSupabaseClient,
  workspaceId: string,
  userId: string,
) {
  const member = await getMembership(supabase, workspaceId, userId);
  if (!member || member.status !== "active") {
    throw new Error("Not an active workspace member");
  }
  return member;
}
