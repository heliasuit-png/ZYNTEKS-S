"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  deleteUserAsAdmin,
  demotePlatformAdmin,
  forceLogoutUser,
  forcePasswordReset,
  getAdminUserDetail,
  promoteUserToAdmin,
  reactivateUser,
  suspendUser,
  transferWorkspaceOwnershipAsAdmin,
} from "@/services/admin";
import type { AdminPlatformRole } from "@/services/admin/types";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export type UserActionResult =
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

async function fail(error: unknown): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  if (isAppError(error)) return { ok: false, message: error.message };
  return { ok: false, message: dict.actionMessages.actionFailed };
}

export async function loadUserDetailAction(userId: string) {
  const session = await requireAdminSession();
  return getAdminUserDetail(session.admin.role, userId);
}

export async function promoteUserAction(
  userId: string,
  role: AdminPlatformRole = "ADMIN",
): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await promoteUserToAdmin(await ctx(), userId, role);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.userPromoted };
  } catch (error) {
    return fail(error);
  }
}

export async function demoteUserAction(userId: string): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await demotePlatformAdmin(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.userDemoted };
  } catch (error) {
    return fail(error);
  }
}

export async function suspendUserAction(userId: string): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await suspendUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.userSuspended };
  } catch (error) {
    return fail(error);
  }
}

export async function reactivateUserAction(
  userId: string,
): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await reactivateUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.userReactivated };
  } catch (error) {
    return fail(error);
  }
}

export async function forcePasswordResetAction(
  userId: string,
): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await forcePasswordReset(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.passwordResetSent };
  } catch (error) {
    return fail(error);
  }
}

export async function forceLogoutAction(userId: string): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    const count = await forceLogoutUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return {
      ok: true,
      message: fillTemplate(dict.actionMessages.admin.userLoggedOut, { count }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await deleteUserAsAdmin(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: dict.actionMessages.admin.userDeleted };
  } catch (error) {
    return fail(error);
  }
}

export async function transferWorkspaceAction(
  workspaceId: string,
  newOwnerUserId: string,
): Promise<UserActionResult> {
  const { dict } = await getDictionary();
  try {
    await transferWorkspaceOwnershipAsAdmin(
      await ctx(),
      workspaceId,
      newOwnerUserId,
    );
    revalidatePath(ADMIN_ROUTES.users);
    return {
      ok: true,
      message: dict.actionMessages.admin.workspaceOwnershipTransferred,
    };
  } catch (error) {
    return fail(error);
  }
}
