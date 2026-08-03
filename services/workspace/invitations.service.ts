import "server-only";

import { randomBytes } from "node:crypto";

import { sendEmail } from "@/emails/send";
import { renderInviteEmail } from "@/emails/templates/invite";
import {
  DASHBOARD_ROUTES,
  ERROR_CODE,
  HTTP_STATUS,
  WORKSPACE_ROLE_LABELS,
} from "@/lib/constants";
import { env } from "@/lib/env";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/services/workspace/audit.service";
import {
  ASSIGNABLE_ROLES,
  hasPermission,
} from "@/services/workspace/permissions";
import {
  getWorkspaceById,
  requireMembership,
} from "@/services/workspace/workspace.service";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database, WorkspaceRole } from "@/types/database";

type Supabase = TypedSupabaseClient;
export type Invitation =
  Database["public"]["Tables"]["workspace_invitations"]["Row"];

const UNIQUE_VIOLATION = "23505";

function mapError(error: { code?: string; message: string; details?: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return new ConflictError("A pending invitation already exists for that email.", {
      cause: error,
    });
  }
  return new AppError(error.message, {
    code: ERROR_CODE.BAD_REQUEST,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    details: error.details,
    cause: error,
  });
}

function newToken(): string {
  return randomBytes(24).toString("hex");
}

async function deliverInvitationEmail(
  supabase: Supabase,
  invitation: Invitation,
  actorId: string,
): Promise<void> {
  const workspace = await getWorkspaceById(supabase, invitation.workspace_id);
  const { data: inviter } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", actorId)
    .maybeSingle();

  const acceptUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${DASHBOARD_ROUTES.invitations}`;
  const content = renderInviteEmail({
    workspaceName: workspace.name,
    roleLabel: WORKSPACE_ROLE_LABELS[invitation.role] ?? invitation.role,
    inviterEmail: inviter?.email ?? null,
    acceptUrl,
  });

  const result = await sendEmail({
    to: invitation.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!result.ok) {
    // Invitation row remains valid; operators can resend after email is configured
    // or share the Invitations page. Never claim delivery when sendEmail fails.
    logger.warn("Invitation email delivery failed", {
      invitationId: invitation.id,
      error: result.error,
    });
  }
}

export async function listInvitations(
  supabase: Supabase,
  workspaceId: string,
  actorId: string,
): Promise<Invitation[]> {
  await requireMembership(supabase, workspaceId, actorId);

  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw mapError(error);
  return data ?? [];
}

export async function inviteMember(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
): Promise<Invitation> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:invite")) {
    throw new ForbiddenError("You cannot invite members.");
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new ValidationError("Invalid invitation role.");
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new ValidationError("Enter a valid email address.");
  }

  // Already a member?
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .limit(1);

  const existingUserId = profiles?.[0]?.id;
  if (existingUserId) {
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", existingUserId)
      .maybeSingle();
    if (existingMember) {
      throw new ConflictError("That user is already a workspace member.");
    }
  }

  const { data, error } = await supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: workspaceId,
      email: normalized,
      role,
      token: newToken(),
      invited_by: actorId,
      status: "pending",
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single();

  if (error) throw mapError(error);

  await deliverInvitationEmail(supabase, data, actorId);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "invitation_sent",
    summary: `Invited ${normalized} as ${role}`,
    resourceType: "workspace_invitation",
    resourceId: data.id,
  });

  return data;
}

export async function resendInvitation(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  invitationId: string,
): Promise<Invitation> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:invite")) {
    throw new ForbiddenError("You cannot resend invitations.");
  }

  const { data, error } = await supabase
    .from("workspace_invitations")
    .update({
      token: newToken(),
      status: "pending",
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", invitationId)
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw mapError(error);
  if (!data) throw new NotFoundError("Pending invitation not found");

  await deliverInvitationEmail(supabase, data, actorId);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "invitation_sent",
    summary: `Resent invitation to ${data.email}`,
    resourceType: "workspace_invitation",
    resourceId: data.id,
  });

  return data;
}

export async function cancelInvitation(
  supabase: Supabase,
  actorId: string,
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  const actor = await requireMembership(supabase, workspaceId, actorId);
  if (!hasPermission(actor.role, "members:invite")) {
    throw new ForbiddenError("You cannot cancel invitations.");
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("workspace_id", workspaceId)
    .eq("status", "pending");

  if (error) throw mapError(error);

  await writeAuditLog(supabase, {
    workspaceId,
    actorId,
    action: "invitation_cancelled",
    summary: "Cancelled a workspace invitation",
    resourceType: "workspace_invitation",
    resourceId: invitationId,
  });
}

export async function getInvitationByToken(
  supabase: Supabase,
  token: string,
): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) throw mapError(error);
  return data;
}

export async function acceptInvitation(
  supabase: Supabase,
  userId: string,
  userEmail: string,
  token: string,
): Promise<Invitation> {
  const invitation = await getInvitationByToken(supabase, token);
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.status !== "pending") {
    throw new ConflictError("This invitation is no longer pending.");
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from("workspace_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    throw new ConflictError("This invitation has expired.");
  }
  if (invitation.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
    throw new ForbiddenError(
      "This invitation was sent to a different email address.",
    );
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
      role: invitation.role,
      status: "active",
      invited_by: invitation.invited_by,
      last_active_at: new Date().toISOString(),
    });

  if (memberError && memberError.code !== UNIQUE_VIOLATION) {
    throw mapError(memberError);
  }

  const { data, error } = await supabase
    .from("workspace_invitations")
    .update({
      status: "accepted",
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id)
    .select("*")
    .single();

  if (error) throw mapError(error);

  await writeAuditLog(supabase, {
    workspaceId: invitation.workspace_id,
    actorId: userId,
    action: "invitation_accepted",
    summary: `${userEmail} accepted a workspace invitation`,
    resourceType: "workspace_invitation",
    resourceId: invitation.id,
  });

  return data;
}

export async function declineInvitation(
  supabase: Supabase,
  userId: string,
  userEmail: string,
  token: string,
): Promise<void> {
  const invitation = await getInvitationByToken(supabase, token);
  if (!invitation) throw new NotFoundError("Invitation not found");
  if (invitation.status !== "pending") {
    throw new ConflictError("This invitation is no longer pending.");
  }
  if (invitation.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
    throw new ForbiddenError(
      "This invitation was sent to a different email address.",
    );
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .update({ status: "declined" })
    .eq("id", invitation.id);

  if (error) throw mapError(error);

  await writeAuditLog(supabase, {
    workspaceId: invitation.workspace_id,
    actorId: userId,
    action: "invitation_declined",
    summary: `${userEmail} declined a workspace invitation`,
    resourceType: "workspace_invitation",
    resourceId: invitation.id,
  });
}

export async function listPendingInvitationsForEmail(
  supabase: Supabase,
  email: string,
): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("status", "pending")
    .ilike("email", email.trim().toLowerCase())
    .order("created_at", { ascending: false });

  if (error) throw mapError(error);
  return data ?? [];
}
