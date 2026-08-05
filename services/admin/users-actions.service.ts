import "server-only";

import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { env } from "@/lib/env";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { writeAdminAuditLog } from "@/services/admin/admin-audit.service";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import { createSupabaseAdminClient } from "@/supabase/admin";

export interface AdminActionContext {
  actorId: string;
  actorRole: AdminPlatformRole;
  ipAddress?: string | null;
}

async function requireTargetProfile(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!data) throw new NotFoundError("User not found");
  return data;
}

export async function promoteUserToAdmin(
  ctx: AdminActionContext,
  userId: string,
  platformRole: AdminPlatformRole = "ADMIN",
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  if (platformRole === "SUPER_ADMIN" && ctx.actorRole !== "SUPER_ADMIN") {
    throw new ForbiddenError("Only SUPER_ADMIN can grant SUPER_ADMIN.");
  }

  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("admin_users")
    .select("id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("admin_users")
      .update({ role: platformRole })
      .eq("user_id", userId);
    if (error) throw mapPostgrestError(error);
  } else {
    const { error } = await admin.from("admin_users").insert({
      user_id: userId,
      role: platformRole,
    });
    if (error) throw mapPostgrestError(error);
  }

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_promoted",
    targetUserId: userId,
    summary: `Promoted ${target.email} to ${platformRole}`,
    metadata: { platformRole },
    ipAddress: ctx.ipAddress,
  });
}

export async function demotePlatformAdmin(
  ctx: AdminActionContext,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  if (userId === ctx.actorId) {
    throw new ForbiddenError("You cannot demote your own admin access.");
  }

  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("admin_users")
    .select("id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) throw new NotFoundError("User is not a platform admin.");

  if (row.role === "SUPER_ADMIN") {
    const { count, error } = await admin
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "SUPER_ADMIN");
    if (error) throw mapPostgrestError(error);
    if ((count ?? 0) <= 1) {
      throw new ForbiddenError("Cannot demote the last SUPER_ADMIN.");
    }
    if (ctx.actorRole !== "SUPER_ADMIN") {
      throw new ForbiddenError("Only SUPER_ADMIN can demote SUPER_ADMIN.");
    }
  }

  const { error } = await admin.from("admin_users").delete().eq("user_id", userId);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_demoted",
    targetUserId: userId,
    summary: `Removed platform admin access for ${target.email}`,
    metadata: { previousRole: row.role },
    ipAddress: ctx.ipAddress,
  });
}

export async function suspendUser(
  ctx: AdminActionContext,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  if (userId === ctx.actorId) {
    throw new ForbiddenError("You cannot suspend your own account.");
  }
  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "banned" })
    .eq("id", userId);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_suspended",
    targetUserId: userId,
    summary: `Suspended ${target.email}`,
    ipAddress: ctx.ipAddress,
  });
}

export async function reactivateUser(
  ctx: AdminActionContext,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_reactivated",
    targetUserId: userId,
    summary: `Reactivated ${target.email}`,
    ipAddress: ctx.ipAddress,
  });
}

export async function forcePasswordReset(
  ctx: AdminActionContext,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:reset_password");
  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();

  const { error } = await admin.auth.resetPasswordForEmail(target.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });
  if (error) {
    throw new ForbiddenError(error.message);
  }

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_password_reset",
    targetUserId: userId,
    summary: `Forced password reset for ${target.email}`,
    ipAddress: ctx.ipAddress,
  });
}

export async function forceLogoutUser(
  ctx: AdminActionContext,
  userId: string,
): Promise<number> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("user_sessions")
    .update({
      revoked_at: new Date().toISOString(),
      is_current: false,
    })
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw mapPostgrestError(error);

  try {
    await admin.auth.admin.signOut(userId);
  } catch {
    // Session table revocation still applies if Auth signOut is unavailable.
  }

  const count = data?.length ?? 0;
  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_force_logout",
    targetUserId: userId,
    summary: `Forced logout for ${target.email} (${count} sessions)`,
    metadata: { sessionsRevoked: count },
    ipAddress: ctx.ipAddress,
  });
  return count;
}

export async function deleteUserAsAdmin(
  ctx: AdminActionContext,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:platform:delete");
  if (userId === ctx.actorId) {
    throw new ForbiddenError("You cannot delete your own account from Admin.");
  }
  const target = await requireTargetProfile(userId);
  const admin = createSupabaseAdminClient();

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminRow?.role === "SUPER_ADMIN") {
    const { count, error } = await admin
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "SUPER_ADMIN");
    if (error) throw mapPostgrestError(error);
    if ((count ?? 0) <= 1) {
      throw new ForbiddenError("Cannot delete the last SUPER_ADMIN.");
    }
  }

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_deleted",
    targetUserId: userId,
    summary: `Deleted user ${target.email}`,
    metadata: { email: target.email, fullName: target.full_name },
    ipAddress: ctx.ipAddress,
  });

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new ForbiddenError(error.message);
}

export async function transferWorkspaceOwnershipAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  newOwnerUserId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:workspaces:write");
  const admin = createSupabaseAdminClient();

  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (wsError) throw mapPostgrestError(wsError);
  if (!workspace) throw new NotFoundError("Workspace not found");

  const newOwner = await requireTargetProfile(newOwnerUserId);

  let { data: targetMember, error: memberError } = await admin
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", newOwnerUserId)
    .maybeSingle();
  if (memberError) throw mapPostgrestError(memberError);

  if (!targetMember) {
    const { data: created, error: createError } = await admin
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: newOwnerUserId,
        role: "owner",
        status: "active",
      })
      .select("*")
      .single();
    if (createError) throw mapPostgrestError(createError);
    targetMember = created;
  } else {
    if (targetMember.status !== "active") {
      throw new ForbiddenError("Cannot transfer ownership to a suspended member.");
    }
    const { error: promoteError } = await admin
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("id", targetMember.id);
    if (promoteError) throw mapPostgrestError(promoteError);
  }

  if (workspace.owner_id !== newOwnerUserId) {
    const { error: demoteError } = await admin
      .from("workspace_members")
      .update({ role: "administrator" })
      .eq("workspace_id", workspaceId)
      .eq("user_id", workspace.owner_id);
    if (demoteError) throw mapPostgrestError(demoteError);
  }

  const { error: ownerError } = await admin
    .from("workspaces")
    .update({ owner_id: newOwnerUserId })
    .eq("id", workspaceId);
  if (ownerError) throw mapPostgrestError(ownerError);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "workspace_transferred",
    targetUserId: newOwnerUserId,
    targetWorkspaceId: workspaceId,
    summary: `Transferred workspace ${workspace.name} to ${newOwner.email}`,
    metadata: {
      workspaceId,
      previousOwnerId: workspace.owner_id,
      newOwnerId: newOwnerUserId,
    },
    ipAddress: ctx.ipAddress,
  });
}
