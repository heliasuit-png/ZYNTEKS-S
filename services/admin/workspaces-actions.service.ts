import "server-only";

import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { writeAdminAuditLog } from "@/services/admin/admin-audit.service";
import { assertAdminPermission } from "@/services/admin/permissions";
import {
  transferWorkspaceOwnershipAsAdmin,
  type AdminActionContext,
} from "@/services/admin/users-actions.service";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { WorkspaceAdminStatus, WorkspaceRole } from "@/types/database";

export type { AdminActionContext };

const PROMOTE_ORDER: WorkspaceRole[] = [
  "viewer",
  "billing_manager",
  "developer",
  "administrator",
];

async function requireWorkspace(workspaceId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, slug, owner_id, admin_status")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!data) throw new NotFoundError("Workspace not found");
  return data;
}

export async function setWorkspaceAdminStatus(
  ctx: AdminActionContext,
  workspaceId: string,
  status: WorkspaceAdminStatus,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:workspaces:write");
  const workspace = await requireWorkspace(workspaceId);
  if (workspace.admin_status === status) return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ admin_status: status })
    .eq("id", workspaceId);
  if (error) throw mapPostgrestError(error);

  const actionMap: Record<
    WorkspaceAdminStatus,
    "workspace_suspended" | "workspace_reactivated" | "workspace_archived"
  > = {
    suspended: "workspace_suspended",
    active: "workspace_reactivated",
    archived: "workspace_archived",
  };

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: actionMap[status],
    targetWorkspaceId: workspaceId,
    targetUserId: workspace.owner_id,
    summary: `Set workspace ${workspace.name} status to ${status}`,
    metadata: {
      workspaceId,
      previousStatus: workspace.admin_status,
      status,
    },
    ipAddress: ctx.ipAddress,
  });
}

export async function renameWorkspaceAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  name: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:workspaces:write");
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new ValidationError("Workspace name must be 2–80 characters.");
  }
  const workspace = await requireWorkspace(workspaceId);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ name: trimmed })
    .eq("id", workspaceId);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "workspace_renamed",
    targetWorkspaceId: workspaceId,
    targetUserId: workspace.owner_id,
    summary: `Renamed workspace from ${workspace.name} to ${trimmed}`,
    metadata: {
      workspaceId,
      previousName: workspace.name,
      name: trimmed,
    },
    ipAddress: ctx.ipAddress,
  });
}

export async function deleteWorkspaceAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  confirmationName: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:platform:delete");
  const workspace = await requireWorkspace(workspaceId);
  if (workspace.name.trim() !== confirmationName.trim()) {
    throw new ValidationError(
      "Type the workspace name exactly to confirm deletion.",
    );
  }

  const admin = createSupabaseAdminClient();
  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "workspace_deleted",
    targetWorkspaceId: null,
    targetUserId: workspace.owner_id,
    summary: `Deleted workspace ${workspace.name}`,
    metadata: {
      workspaceId,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.owner_id,
    },
    ipAddress: ctx.ipAddress,
  });

  const { error } = await admin.from("workspaces").delete().eq("id", workspaceId);
  if (error) throw mapPostgrestError(error);
}

export async function removeWorkspaceMemberAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  userId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:workspaces:write");
  const workspace = await requireWorkspace(workspaceId);
  if (workspace.owner_id === userId) {
    throw new ForbiddenError(
      "Cannot remove the workspace owner. Transfer ownership first.",
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: member, error: memberError } = await admin
    .from("workspace_members")
    .select("id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw mapPostgrestError(memberError);
  if (!member) throw new NotFoundError("Member not found");

  const { error } = await admin
    .from("workspace_members")
    .delete()
    .eq("id", member.id);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "workspace_member_removed",
    targetWorkspaceId: workspaceId,
    targetUserId: userId,
    summary: `Removed member from workspace ${workspace.name}`,
    metadata: { workspaceId, userId, previousRole: member.role },
    ipAddress: ctx.ipAddress,
  });
}

function nextRole(
  current: WorkspaceRole,
  direction: "up" | "down",
): WorkspaceRole | null {
  if (current === "owner") return null;
  const index = PROMOTE_ORDER.indexOf(current);
  if (index < 0) return null;
  if (direction === "up") {
    if (index >= PROMOTE_ORDER.length - 1) return null;
    return PROMOTE_ORDER[index + 1]!;
  }
  if (index <= 0) return null;
  return PROMOTE_ORDER[index - 1]!;
}

export async function changeWorkspaceMemberRoleAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  userId: string,
  direction: "up" | "down",
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:workspaces:write");
  const workspace = await requireWorkspace(workspaceId);
  if (workspace.owner_id === userId) {
    throw new ForbiddenError(
      "Owner role can only change via ownership transfer.",
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: member, error: memberError } = await admin
    .from("workspace_members")
    .select("id, role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw mapPostgrestError(memberError);
  if (!member) throw new NotFoundError("Member not found");
  if (member.status !== "active") {
    throw new ForbiddenError("Cannot change role of a suspended member.");
  }

  const role = nextRole(member.role, direction);
  if (!role) {
    throw new ValidationError(
      direction === "up"
        ? "Member is already at the highest non-owner role."
        : "Member is already at the lowest role.",
    );
  }

  const { error } = await admin
    .from("workspace_members")
    .update({ role })
    .eq("id", member.id);
  if (error) throw mapPostgrestError(error);

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action:
      direction === "up"
        ? "workspace_member_promoted"
        : "workspace_member_demoted",
    targetWorkspaceId: workspaceId,
    targetUserId: userId,
    summary: `${direction === "up" ? "Promoted" : "Demoted"} member in ${workspace.name} to ${role}`,
    metadata: {
      workspaceId,
      userId,
      previousRole: member.role,
      role,
    },
    ipAddress: ctx.ipAddress,
  });
}

export async function transferWorkspaceAsAdmin(
  ctx: AdminActionContext,
  workspaceId: string,
  newOwnerUserId: string,
): Promise<void> {
  await transferWorkspaceOwnershipAsAdmin(ctx, workspaceId, newOwnerUserId);
}
