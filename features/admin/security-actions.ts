"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { revokeSessionAsAdmin } from "@/services/admin/security-actions.service";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export type SecurityActionResult =
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

export async function revokeSessionAction(
  sessionId: string,
): Promise<SecurityActionResult> {
  try {
    await revokeSessionAsAdmin(await ctx(), sessionId);
    revalidatePath(ADMIN_ROUTES.security);
    return { ok: true, message: "Session revoked." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Failed to revoke session." };
  }
}
