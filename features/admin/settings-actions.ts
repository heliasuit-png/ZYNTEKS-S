"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ADMIN_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import {
  createFeatureFlagAsAdmin,
  updateFeatureFlagStatusAsAdmin,
  updatePlatformSystemSettingsAsAdmin,
} from "@/services/admin/platform-settings-actions.service";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export type SettingsActionResult =
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

export async function updateFeatureFlagStatusAction(
  flagId: string,
  status: string,
): Promise<SettingsActionResult> {
  try {
    await updateFeatureFlagStatusAsAdmin(await ctx(), flagId, status);
    revalidatePath(ADMIN_ROUTES.settings);
    return { ok: true, message: "Feature flag updated." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Failed to update feature flag." };
  }
}

export async function createFeatureFlagAction(input: {
  key: string;
  name: string;
  description?: string;
  scope: string;
  status: string;
}): Promise<SettingsActionResult> {
  try {
    await createFeatureFlagAsAdmin(await ctx(), input);
    revalidatePath(ADMIN_ROUTES.settings);
    return { ok: true, message: "Feature flag created." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Failed to create feature flag." };
  }
}

export async function updatePlatformSettingsAction(input: {
  platformName?: string;
  maintenanceEnabled?: boolean;
  maintenanceMessage?: string | null;
  registrationEnabled?: boolean;
  passwordMinLength?: number;
  sessionTimeoutHours?: number;
  mfaRequired?: boolean;
}): Promise<SettingsActionResult> {
  try {
    await updatePlatformSystemSettingsAsAdmin(await ctx(), input);
    revalidatePath(ADMIN_ROUTES.settings);
    return { ok: true, message: "Platform settings saved." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Failed to save platform settings." };
  }
}
