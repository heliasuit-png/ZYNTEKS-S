import "server-only";

import { revalidateTag } from "next/cache";

import { BadRequestError, NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { writeAdminAuditLog } from "@/services/admin/admin-audit.service";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminActionContext } from "@/services/admin/users-actions.service";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type {
  FeatureFlagScope,
  FeatureFlagStatus,
} from "@/types/database";

const FLAG_STATUSES: readonly FeatureFlagStatus[] = [
  "enabled",
  "disabled",
  "beta",
  "internal",
];

const FLAG_SCOPES: readonly FeatureFlagScope[] = [
  "global",
  "workspace",
  "project",
  "user",
];

function assertFlagStatus(value: string): FeatureFlagStatus {
  if (!FLAG_STATUSES.includes(value as FeatureFlagStatus)) {
    throw new BadRequestError("Invalid feature flag status");
  }
  return value as FeatureFlagStatus;
}

function assertFlagScope(value: string): FeatureFlagScope {
  if (!FLAG_SCOPES.includes(value as FeatureFlagScope)) {
    throw new BadRequestError("Invalid feature flag scope");
  }
  return value as FeatureFlagScope;
}

export async function updateFeatureFlagStatusAsAdmin(
  ctx: AdminActionContext,
  flagId: string,
  status: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:settings:write");
  const nextStatus = assertFlagStatus(status);
  const admin = createSupabaseAdminClient();

  const { data: existing, error } = await admin
    .from("feature_flags")
    .select("id, key, name, status")
    .eq("id", flagId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!existing) throw new NotFoundError("Feature flag not found");

  const { error: updateError } = await admin
    .from("feature_flags")
    .update({
      status: nextStatus,
      updated_by: ctx.actorId,
    })
    .eq("id", flagId);
  if (updateError) throw mapPostgrestError(updateError);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "feature_flag_updated",
    summary: `Updated feature flag ${existing.key} → ${nextStatus}`,
    metadata: {
      flagId,
      key: existing.key,
      previousStatus: existing.status,
      status: nextStatus,
    },
    ipAddress: ctx.ipAddress,
  });
}

export async function createFeatureFlagAsAdmin(
  ctx: AdminActionContext,
  input: {
    key: string;
    name: string;
    description?: string;
    scope: string;
    status: string;
  },
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:settings:write");

  const key = input.key.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[a-z][a-z0-9_.-]{1,63}$/.test(key)) {
    throw new BadRequestError(
      "Flag key must be 2–64 chars: lowercase letter, then letters/digits/._-",
    );
  }
  if (name.length < 2 || name.length > 120) {
    throw new BadRequestError("Flag name must be 2–120 characters");
  }

  const scope = assertFlagScope(input.scope);
  const status = assertFlagStatus(input.status);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("feature_flags")
    .insert({
      key,
      name,
      description: (input.description ?? "").trim(),
      scope,
      status,
      updated_by: ctx.actorId,
    })
    .select("id, key")
    .single();
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "feature_flag_updated",
    summary: `Created feature flag ${data.key}`,
    metadata: { flagId: data.id, key: data.key, status, scope },
    ipAddress: ctx.ipAddress,
  });
}

export async function updatePlatformSystemSettingsAsAdmin(
  ctx: AdminActionContext,
  input: {
    platformName?: string;
    maintenanceEnabled?: boolean;
    maintenanceMessage?: string | null;
    registrationEnabled?: boolean;
    passwordMinLength?: number;
    sessionTimeoutHours?: number;
    mfaRequired?: boolean;
  },
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:settings:write");
  const admin = createSupabaseAdminClient();

  const { data: current, error } = await admin
    .from("platform_settings")
    .select(
      "platform_name, maintenance_enabled, maintenance_message, registration_enabled, password_min_length, session_timeout_hours, mfa_required",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!current) throw new NotFoundError("Platform settings not found");

  const patch: {
    platform_name?: string;
    maintenance_enabled?: boolean;
    maintenance_message?: string | null;
    registration_enabled?: boolean;
    password_min_length?: number;
    session_timeout_hours?: number;
    mfa_required?: boolean;
    updated_by: string;
  } = { updated_by: ctx.actorId };

  if (input.platformName !== undefined) {
    const name = input.platformName.trim();
    if (name.length < 2 || name.length > 80) {
      throw new BadRequestError("Platform name must be 2–80 characters");
    }
    patch.platform_name = name;
  }
  if (input.maintenanceEnabled !== undefined) {
    patch.maintenance_enabled = input.maintenanceEnabled;
  }
  if (input.maintenanceMessage !== undefined) {
    const message = input.maintenanceMessage?.trim() || null;
    if (message && message.length > 500) {
      throw new BadRequestError("Maintenance message must be at most 500 characters");
    }
    patch.maintenance_message = message;
  }
  if (input.registrationEnabled !== undefined) {
    patch.registration_enabled = input.registrationEnabled;
  }
  if (input.passwordMinLength !== undefined) {
    if (
      !Number.isInteger(input.passwordMinLength) ||
      input.passwordMinLength < 6 ||
      input.passwordMinLength > 128
    ) {
      throw new BadRequestError("Password min length must be between 6 and 128");
    }
    patch.password_min_length = input.passwordMinLength;
  }
  if (input.sessionTimeoutHours !== undefined) {
    if (
      !Number.isInteger(input.sessionTimeoutHours) ||
      input.sessionTimeoutHours < 1 ||
      input.sessionTimeoutHours > 8760
    ) {
      throw new BadRequestError("Session timeout must be between 1 and 8760 hours");
    }
    patch.session_timeout_hours = input.sessionTimeoutHours;
  }
  if (input.mfaRequired !== undefined) {
    patch.mfa_required = input.mfaRequired;
  }

  const { error: updateError } = await admin
    .from("platform_settings")
    .update(patch)
    .eq("id", 1);
  if (updateError) throw mapPostgrestError(updateError);

  revalidateTag("platform-runtime-settings");

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "platform_settings_updated",
    summary: "Updated platform settings",
    metadata: {
      previous: current,
      next: {
        platform_name: patch.platform_name ?? current.platform_name,
        maintenance_enabled:
          patch.maintenance_enabled ?? current.maintenance_enabled,
        registration_enabled:
          patch.registration_enabled ?? current.registration_enabled,
        password_min_length:
          patch.password_min_length ?? current.password_min_length,
        session_timeout_hours:
          patch.session_timeout_hours ?? current.session_timeout_hours,
        mfa_required: patch.mfa_required ?? current.mfa_required,
      },
    },
    ipAddress: ctx.ipAddress,
  });
}
