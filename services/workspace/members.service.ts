import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/services/workspace/audit.service";
import { hasPermission } from "@/services/workspace/permissions";
import { requireMembership } from "@/services/workspace/workspace.service";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database, WorkspaceRole } from "@/types/database";

type Supabase = TypedSupabaseClient;
type Member = Database["public"]["Tables"]["workspace_members"]["Row"];

export interface MemberCard {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: WorkspaceRole;
  status: Member["status"];
  lastActiveAt: string | null;
  projectCount: number;
  createdAt: string;
}

function mapError(error: { message: string; details?: string }) {
  return new AppError(error.message, {
    code: ERROR_CODE.BAD_REQUEST,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    details: error.details,
    cause: error,
  });
}

export async function listMembers(
  supabase: Supabase,
  workspaceId: string,
  actorId: string,
): Promise<MemberCard[]> {
  await requireMembership(supabase, workspaceId, actorId);

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw mapError(error);
  const rows = members ?? [];
  if (rows.length === 0) return [];

  const userIds = rows.map((m) => m.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds);

  if (profileError) throw mapError(profileError);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: projects } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("workspace_id", workspaceId);

  const projectCountByUser = new Map<string, number>();
  for (const p of projects ?? []) {
    projectCountByUser.set(p.user_id, (projectCountByUser.get(p.user_id) ?? 0) + 1);
  }

  return rows.map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      email: profile?.email ?? "unknown",
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      role: m.role,
      status: m.status,
      lastActiveAt: m.last_active_at,
      projectCount: projectCountByUser.get(m.user_id) ?? 0,
      createdAt: m.created_at,
    };
  });
}

export async function changeMemberRole(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:change_role")) {
    throw new ForbiddenError("You cannot change member roles.");
  }
  if (role === "owner") {
    throw new ForbiddenError("Use ownership transfer to assign the owner role.");
  }

  const { data: target, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw mapError(error);
  if (!target) throw new NotFoundError("Member not found");
  if (target.role === "owner") {
    throw new ForbiddenError("Cannot change the owner's role.");
  }

  const { error: updateError } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId);

  if (updateError) throw mapError(updateError);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "role_changed",
    summary: `Changed role for member to ${role}`,
    resourceType: "workspace_member",
    resourceId: memberId,
    metadata: { role, targetUserId: target.user_id },
  });
}

export async function removeMember(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  memberId: string,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:remove")) {
    throw new ForbiddenError("You cannot remove members.");
  }

  const { data: target, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw mapError(error);
  if (!target) throw new NotFoundError("Member not found");
  if (target.role === "owner") {
    throw new ForbiddenError("Cannot remove the workspace owner.");
  }
  if (target.user_id === actorId) {
    throw new ForbiddenError("Use leave workspace instead of removing yourself.");
  }

  const { error: deleteError } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (deleteError) throw mapError(deleteError);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "member_removed",
    summary: "Removed a workspace member",
    resourceType: "workspace_member",
    resourceId: memberId,
    metadata: { targetUserId: target.user_id },
  });
}

export async function suspendMember(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  memberId: string,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:suspend")) {
    throw new ForbiddenError("You cannot suspend members.");
  }

  const { data: target, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw mapError(error);
  if (!target) throw new NotFoundError("Member not found");
  if (target.role === "owner") {
    throw new ForbiddenError("Cannot suspend the workspace owner.");
  }

  const { error: updateError } = await supabase
    .from("workspace_members")
    .update({ status: "suspended" })
    .eq("id", memberId);

  if (updateError) throw mapError(updateError);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "member_suspended",
    summary: "Suspended a workspace member",
    resourceType: "workspace_member",
    resourceId: memberId,
    metadata: { targetUserId: target.user_id },
  });
}

export async function restoreMember(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  memberId: string,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:suspend")) {
    throw new ForbiddenError("You cannot restore members.");
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (error) throw mapError(error);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "member_restored",
    summary: "Restored a suspended workspace member",
    resourceType: "workspace_member",
    resourceId: memberId,
  });
}

export async function transferOwnership(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  newOwnerMemberId: string,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "workspace:transfer") || actor.role !== "owner") {
    throw new ForbiddenError("Only the owner can transfer ownership.");
  }

  const { data: target, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("id", newOwnerMemberId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw mapError(error);
  if (!target) throw new NotFoundError("Member not found");
  if (target.status !== "active") {
    throw new ForbiddenError("Cannot transfer ownership to a suspended member.");
  }
  if (target.user_id === actorId) return;

  const { error: demoteError } = await supabase
    .from("workspace_members")
    .update({ role: "administrator" })
    .eq("id", actor.id);
  if (demoteError) throw mapError(demoteError);

  const { error: promoteError } = await supabase
    .from("workspace_members")
    .update({ role: "owner" })
    .eq("id", target.id);
  if (promoteError) throw mapError(promoteError);

  const { error: wsError } = await supabase
    .from("workspaces")
    .update({ owner_id: target.user_id })
    .eq("id", workspaceId);
  if (wsError) throw mapError(wsError);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "ownership_transferred",
    summary: "Transferred workspace ownership",
    resourceType: "workspace",
    resourceId: workspaceId,
    metadata: { newOwnerId: target.user_id },
  });
}

export async function touchMemberActivity(
  supabase: Supabase,
  workspaceId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("workspace_members")
    .update({ last_active_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
}
