"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
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

async function fail(error: unknown): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  if (isAppError(error)) return { ok: false, message: error.message };
  return { ok: false, message: dict.actionMessages.actionFailed };
}

export async function loadWorkspaceDetailAction(workspaceId: string) {
  const session = await requireAdminSession();
  return getAdminWorkspaceDetail(session.admin.role, workspaceId);
}

export async function setWorkspaceStatusAction(
  workspaceId: string,
  status: WorkspaceAdminStatus,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await setWorkspaceAdminStatus(await ctx(), workspaceId, status);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return {
      ok: true,
      message: fillTemplate(dict.actionMessages.admin.workspaceMarked, {
        status,
      }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function renameWorkspaceAction(
  workspaceId: string,
  name: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await renameWorkspaceAsAdmin(await ctx(), workspaceId, name);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: dict.actionMessages.admin.workspaceRenamed };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteWorkspaceAction(
  workspaceId: string,
  confirmationName: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await deleteWorkspaceAsAdmin(await ctx(), workspaceId, confirmationName);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: dict.actionMessages.admin.workspaceDeleted };
  } catch (error) {
    return fail(error);
  }
}

export async function transferWorkspaceOwnerAction(
  workspaceId: string,
  newOwnerUserId: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await transferWorkspaceAsAdmin(await ctx(), workspaceId, newOwnerUserId);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return {
      ok: true,
      message: dict.actionMessages.admin.ownershipTransferred,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await removeWorkspaceMemberAsAdmin(await ctx(), workspaceId, userId);
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: dict.actionMessages.admin.memberRemoved };
  } catch (error) {
    return fail(error);
  }
}

export async function promoteMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await changeWorkspaceMemberRoleAsAdmin(
      await ctx(),
      workspaceId,
      userId,
      "up",
    );
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: dict.actionMessages.admin.memberPromoted };
  } catch (error) {
    return fail(error);
  }
}

export async function demoteMemberAction(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceActionResult> {
  const { dict } = await getDictionary();
  try {
    await changeWorkspaceMemberRoleAsAdmin(
      await ctx(),
      workspaceId,
      userId,
      "down",
    );
    revalidatePath(ADMIN_ROUTES.workspaces);
    return { ok: true, message: dict.actionMessages.admin.memberDemoted };
  } catch (error) {
    return fail(error);
  }
}
