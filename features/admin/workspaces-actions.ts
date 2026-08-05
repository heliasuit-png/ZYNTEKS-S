"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import {
  changeWorkspaceMemberRoleAsAdmin,
  deleteWorkspaceAsAdmin,
  getAdminWorkspaceDetail,
  removeWorkspaceMemberAsAdmin,
  renameWorkspaceAsAdmin,
  setWorkspaceAdminStatus,
  transferWorkspaceAsAdmin,
} from "@/services/admin";
import type { WorkspaceAdminStatus } from "@/types/database";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export type WorkspaceActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

async function ctx() {
  const session = await requireAdminSession();
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip");
  return {
    actorId: session.admin.userId,
    actorRole: session.admin.role,
    ipAddress: ip,
  };
}

function fail(error: unknown): WorkspaceActionResult {
  if (isAppError(error)) return { ok: false, message: error.message };
  return { ok: false, message: "Action failed. Please try again." };
}

export async function loadWorkspaceDetailAction(workspaceId: string) {
  const session = await requireAdminSession();
  return getAdminWorkspaceDetail(session.admin.role, workspaceId);
}

export async function setWorkspaceStatusAction(
  workspaceId: string,
  status: WorkspaceAdminStatus,
): Promise<WorkspaceActionResult> {
  try {
    await setWorkspaceAdminStatus(await ctx(), workspaceId, status);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: `Workspace marked ${status}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function renameWorkspaceAction(
  workspaceId: string,
  name: string,
): Promise<WorkspaceActionResult> {
  try {
    await renameWorkspaceAsAdmin(await ctx(), workspaceId, name);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Workspace renamed." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteWorkspaceAction(
  workspaceId: string,
  confirmationName: string,
): Promise<WorkspaceActionResult> {
  try {
    await deleteWorkspaceAsAdmin(await ctx(), workspaceId, confirmationName);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Workspace deleted." };
  } catch (error) {
    return fail(error);
  }
}

export async function transferWorkspaceOwnerAction(
  workspaceId: string,
  newOwnerUserId: string,
): Promise<WorkspaceActionResult> {
  try {
    await transferWorkspaceAsAdmin(await ctx(), workspaceId, newOwnerUserId);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Ownership transferred." };
  } catch (error) {
    return fail(error);
  }
}

export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  try {
    await removeWorkspaceMemberAsAdmin(await ctx(), workspaceId, userId);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Member removed." };
  } catch (error) {
    return fail(error);
  }
}

export async function promoteMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  try {
    await changeWorkspaceMemberRoleAsAdmin(
      await ctx(),
      workspaceId,
      userId,
      "up",
    );
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Member promoted." };
  } catch (error) {
    return fail(error);
  }
}

export async function demoteMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  try {
    await changeWorkspaceMemberRoleAsAdmin(
      await ctx(),
      workspaceId,
      userId,
      "down",
    );
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: "Member demoted." };
  } catch (error) {
    return fail(error);
  }
}
