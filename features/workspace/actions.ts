"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { isAppError } from "@/lib/errors";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAuthenticatedUser } from "@/services/auth";
import {
  acceptInvitation,
  cancelInvitation,
  changeMemberRole,
  createWorkspace,
  declineInvitation,
  deleteWorkspace,
  inviteMember,
  removeMember,
  resendInvitation,
  restoreMember,
  revokeOtherSessions,
  revokeSession,
  suspendMember,
  transferOwnership,
  updateWorkspace,
} from "@/services/workspace";
import {
  setActiveWorkspaceCookie,
  WORKSPACE_COOKIE,
} from "@/services/workspace/active";
import { createSupabaseServerClient } from "@/supabase/server";
import type { WorkspaceRole } from "@/types/database";

export type ActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

function fail(error: unknown, fallback: string): ActionState {
  if (isAppError(error)) return { ok: false, error: error.message };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: fallback };
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    const { dict } = await getDictionary();
    throw new Error(dict.actionMessages.mustSignIn);
  }
  return { supabase, user };
}

export async function switchWorkspaceAction(
  workspaceId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const { data } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!data) return { ok: false, error: am.workspaceNotMember };
    await setActiveWorkspaceCookie(workspaceId);
    revalidatePath("/", "layout");
    return { ok: true, message: am.workspaceSwitched };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function createWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: am.workspaceNameRequired };
    const ws = await createWorkspace(supabase, user.id, { name });
    await setActiveWorkspaceCookie(ws.id);
    revalidatePath("/", "layout");
    return { ok: true, message: am.workspaceCreated };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function updateOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const workspaceId = String(formData.get("workspaceId") ?? "");
    let logoUrl = String(formData.get("logoUrl") ?? "") || null;
    const logoFile = formData.get("logoFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) {
        return { ok: false, error: am.logoTooLarge };
      }
      const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${workspaceId}/logo-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from("workspace-logos")
        .upload(path, buffer, { contentType: logoFile.type, upsert: true });
      if (uploadError) return { ok: false, error: uploadError.message };
      logoUrl = supabase.storage.from("workspace-logos").getPublicUrl(path)
        .data.publicUrl;
    }

    await updateWorkspace(supabase, user.id, workspaceId, {
      name: String(formData.get("name") ?? "").trim() || undefined,
      slug: String(formData.get("slug") ?? "").trim() || undefined,
      timezone: String(formData.get("timezone") ?? "") || undefined,
      brandColor: String(formData.get("brandColor") ?? "") || undefined,
      logoUrl,
      notificationDefaults: {
        email: formData.get("notifyEmail") === "on",
        dashboard: formData.get("notifyDashboard") === "on",
      },
      securityPolicies: {
        require_2fa: formData.get("require2fa") === "on",
        session_timeout_hours: Number(formData.get("sessionTimeout") ?? 720) || 720,
      },
    });
    revalidatePath(DASHBOARD_ROUTES.organization);
    revalidatePath(DASHBOARD_ROUTES.settings);
    return { ok: true, message: am.organizationSaved };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function deleteWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const workspaceId = String(formData.get("workspaceId") ?? "");
    const confirmationName = String(formData.get("confirmationName") ?? "");
    await deleteWorkspace(supabase, user.id, workspaceId, confirmationName);
    const jar = await cookies();
    jar.delete(WORKSPACE_COOKIE);
    revalidatePath("/", "layout");
  } catch (error) {
    return fail(error, am.genericError);
  }
  redirect(DASHBOARD_ROUTES.dashboard);
}

export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const workspaceId = String(formData.get("workspaceId") ?? "");
    const email = String(formData.get("email") ?? "");
    const role = String(formData.get("role") ?? "developer") as WorkspaceRole;
    await inviteMember(supabase, user.id, workspaceId, email, role);
    revalidatePath(DASHBOARD_ROUTES.members);
    revalidatePath(DASHBOARD_ROUTES.invitations);
    return {
      ok: true,
      message: am.invitationCreated,
    };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function resendInvitationAction(
  workspaceId: string,
  invitationId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await resendInvitation(supabase, user.id, workspaceId, invitationId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return {
      ok: true,
      message: am.invitationResent,
    };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function cancelInvitationAction(
  workspaceId: string,
  invitationId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await cancelInvitation(supabase, user.id, workspaceId, invitationId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.invitationCancelled };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function acceptInvitationAction(token: string): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const email = user.email;
    if (!email) return { ok: false, error: am.accountNoEmail };
    const invitation = await acceptInvitation(supabase, user.id, email, token);
    await setActiveWorkspaceCookie(invitation.workspace_id);
    revalidatePath("/", "layout");
    return { ok: true, message: am.invitationAccepted };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function declineInvitationAction(token: string): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const email = user.email;
    if (!email) return { ok: false, error: am.accountNoEmail };
    await declineInvitation(supabase, user.id, email, token);
    revalidatePath(DASHBOARD_ROUTES.invitations);
    return { ok: true, message: am.invitationDeclined };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function changeRoleAction(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await changeMemberRole(supabase, user.id, workspaceId, memberId, role);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.roleUpdated };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function removeMemberAction(
  workspaceId: string,
  memberId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await removeMember(supabase, user.id, workspaceId, memberId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.memberRemoved };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function suspendMemberAction(
  workspaceId: string,
  memberId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await suspendMember(supabase, user.id, workspaceId, memberId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.memberSuspended };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function restoreMemberAction(
  workspaceId: string,
  memberId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await restoreMember(supabase, user.id, workspaceId, memberId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.memberRestored };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function transferOwnershipAction(
  workspaceId: string,
  memberId: string,
): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    await transferOwnership(supabase, user.id, workspaceId, memberId);
    revalidatePath(DASHBOARD_ROUTES.members);
    return { ok: true, message: am.ownershipTransferred };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function revokeSessionAction(sessionId: string): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const cookieStore = await cookies();
    const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
    await revokeSession(supabase, user.id, sessionId, workspaceId);
    revalidatePath(DASHBOARD_ROUTES.security);
    return { ok: true, message: am.sessionRevoked };
  } catch (error) {
    return fail(error, am.genericError);
  }
}

export async function revokeOtherSessionsAction(): Promise<ActionState> {
  const { dict } = await getDictionary();
  const am = dict.actionMessages;
  try {
    const { supabase, user } = await requireUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { ok: false, error: am.noActiveSession };
    }
    const cookieStore = await cookies();
    const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
    const count = await revokeOtherSessions(
      supabase,
      user.id,
      session.access_token,
      workspaceId,
    );
    revalidatePath(DASHBOARD_ROUTES.security);
    return {
      ok: true,
      message: fillTemplate(
        count === 1 ? am.otherSessionsRevoked : am.otherSessionsRevokedPlural,
        { count },
      ),
    };
  } catch (error) {
    return fail(error, am.genericError);
  }
}
