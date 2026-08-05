"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
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

function fail(error: unknown): UserActionResult {
  if (isAppError(error)) return { ok: false, message: error.message };
  return { ok: false, message: "Action failed. Please try again." };
}

export async function loadUserDetailAction(userId: string) {
  const session = await requireAdminSession();
  return getAdminUserDetail(session.admin.role, userId);
}

export async function promoteUserAction(
  userId: string,
  role: AdminPlatformRole = "ADMIN",
): Promise<UserActionResult> {
  try {
    await promoteUserToAdmin(await ctx(), userId, role);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "User promoted to platform admin." };
  } catch (error) {
    return fail(error);
  }
}

export async function demoteUserAction(userId: string): Promise<UserActionResult> {
  try {
    await demotePlatformAdmin(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "Platform admin access removed." };
  } catch (error) {
    return fail(error);
  }
}

export async function suspendUserAction(userId: string): Promise<UserActionResult> {
  try {
    await suspendUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "User suspended." };
  } catch (error) {
    return fail(error);
  }
}

export async function reactivateUserAction(
  userId: string,
): Promise<UserActionResult> {
  try {
    await reactivateUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "User reactivated." };
  } catch (error) {
    return fail(error);
  }
}

export async function forcePasswordResetAction(
  userId: string,
): Promise<UserActionResult> {
  try {
    await forcePasswordReset(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "Password reset email sent." };
  } catch (error) {
    return fail(error);
  }
}

export async function forceLogoutAction(userId: string): Promise<UserActionResult> {
  try {
    const count = await forceLogoutUser(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: `Logged out (${count} sessions revoked).` };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  try {
    await deleteUserAsAdmin(await ctx(), userId);
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "User deleted." };
  } catch (error) {
    return fail(error);
  }
}

export async function transferWorkspaceAction(
  workspaceId: string,
  newOwnerUserId: string,
): Promise<UserActionResult> {
  try {
    await transferWorkspaceOwnershipAsAdmin(
      await ctx(),
      workspaceId,
      newOwnerUserId,
    );
    revalidatePath(ADMIN_ROUTES.users);
    return { ok: true, message: "Workspace ownership transferred." };
  } catch (error) {
    return fail(error);
  }
}
