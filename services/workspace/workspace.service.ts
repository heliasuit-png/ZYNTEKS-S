import "server-only";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { slugify } from "@/utils/string";
import { writeAuditLog } from "@/services/workspace/audit.service";
import { hasPermission } from "@/services/workspace/permissions";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  Database,
  Json,
  SubscriptionPlan,
  WorkspaceRole,
} from "@/types/database";

type Supabase = TypedSupabaseClient;
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];

const UNIQUE_VIOLATION = "23505";

function mapError(error: { code?: string; message: string; details?: string }) {
  if (error.code === UNIQUE_VIOLATION) {
    return new ConflictError("A workspace with that slug already exists.", {
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

export interface WorkspaceSummary extends Workspace {
  role: WorkspaceRole;
  memberCount: number;
  projectCount: number;
}

/** Ensures the user has at least one workspace (personal) and returns them. */
export async function ensureUserWorkspaces(
  supabase: Supabase,
  userId: string,
  email?: string | null,
  fullName?: string | null,
): Promise<Workspace[]> {
  const existing = await listUserWorkspaces(supabase, userId);
  if (existing.length > 0) {
    return existing.map((w) => w);
  }

  const baseName =
    fullName?.trim() ||
    (email ? email.split("@")[0] : null) ||
    "Personal";
  const name = `${baseName}'s Workspace`;
  const slug = `ws-${userId.replace(/-/g, "")}`;

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      owner_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    // Race: another request may have created it.
    const again = await listUserWorkspaces(supabase, userId);
    if (again.length > 0) return again;
    throw mapError(error);
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "owner",
      status: "active",
    });

  if (memberError && memberError.code !== UNIQUE_VIOLATION) {
    throw mapError(memberError);
  }

  return [workspace];
}

export async function listUserWorkspaces(
  supabase: Supabase,
  userId: string,
): Promise<Workspace[]> {
  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw mapError(error);
  const ids = (memberships ?? []).map((m) => m.workspace_id);
  if (ids.length === 0) return [];

  const { data, error: wsError } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true });

  if (wsError) throw mapError(wsError);
  return data ?? [];
}

export async function listWorkspaceSummaries(
  supabase: Supabase,
  userId: string,
): Promise<WorkspaceSummary[]> {
  const workspaces = await listUserWorkspaces(supabase, userId);
  if (workspaces.length === 0) return [];

  const summaries: WorkspaceSummary[] = [];
  for (const ws of workspaces) {
    const [member, membersCount, projectsCount] = await Promise.all([
      getMembership(supabase, ws.id, userId),
      supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ws.id),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ws.id),
    ]);

    summaries.push({
      ...ws,
      role: member?.role ?? "viewer",
      memberCount: membersCount.count ?? 0,
      projectCount: projectsCount.count ?? 0,
    });
  }
  return summaries;
}

export async function getWorkspaceById(
  supabase: Supabase,
  workspaceId: string,
): Promise<Workspace> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) throw mapError(error);
  if (!data) throw new NotFoundError("Workspace not found");
  return data;
}

export async function getMembership(
  supabase: Supabase,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember | null> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw mapError(error);
  return data;
}

export async function requireMembership(
  supabase: Supabase,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember> {
  const member = await getMembership(supabase, workspaceId, userId);
  if (!member || member.status !== "active") {
    throw new ForbiddenError("You are not an active member of this workspace.");
  }
  return member;
}

export async function createWorkspace(
  supabase: Supabase,
  userId: string,
  input: { name: string; timezone?: string; brandColor?: string },
): Promise<Workspace> {
  const base = slugify(input.name) || "workspace";
  let slug = base;
  let suffix = 1;
  while (suffix < 1000) {
    const { data } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: input.name.trim(),
      slug,
      owner_id: userId,
      timezone: input.timezone ?? "UTC",
      brand_color: input.brandColor ?? "#00E5FF",
    })
    .select("*")
    .single();

  if (error) throw mapError(error);

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: data.id,
      user_id: userId,
      role: "owner",
      status: "active",
    });

  if (memberError) throw mapError(memberError);

  await writeAuditLog(supabase, {
    workspaceId: data.id,
    actorId: userId,
    action: "workspace_updated",
    summary: `Created workspace "${data.name}"`,
    resourceType: "workspace",
    resourceId: data.id,
  });

  return data;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  timezone?: string;
  brandColor?: string;
  notificationDefaults?: Json;
  securityPolicies?: Json;
  plan?: SubscriptionPlan;
}

export async function updateWorkspace(
  supabase: Supabase,
  userId: string,
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  const member = await requireMembership(supabase, workspaceId, userId);
  if (!hasPermission(member.role, "settings:manage")) {
    throw new ForbiddenError("You do not have permission to update this workspace.");
  }

  const payload: Database["public"]["Tables"]["workspaces"]["Update"] = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.slug !== undefined) {
    payload.slug = slugify(input.slug) || "workspace";
  }
  if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl;
  if (input.timezone !== undefined) payload.timezone = input.timezone;
  if (input.brandColor !== undefined) payload.brand_color = input.brandColor;
  if (input.notificationDefaults !== undefined) {
    payload.notification_defaults = input.notificationDefaults;
  }
  if (input.securityPolicies !== undefined) {
    payload.security_policies = input.securityPolicies;
  }
  if (input.plan !== undefined) payload.plan = input.plan;

  const { data, error } = await supabase
    .from("workspaces")
    .update(payload)
    .eq("id", workspaceId)
    .select("*")
    .maybeSingle();

  if (error) throw mapError(error);
  if (!data) throw new NotFoundError("Workspace not found");

  await writeAuditLog(supabase, {
    workspaceId,
    actorId: userId,
    action: "workspace_updated",
    summary: `Updated workspace settings for "${data.name}"`,
    resourceType: "workspace",
    resourceId: workspaceId,
  });

  return data;
}

export async function deleteWorkspace(
  supabase: Supabase,
  userId: string,
  workspaceId: string,
  confirmationName: string,
): Promise<void> {
  const member = await requireMembership(supabase, workspaceId, userId);
  if (!hasPermission(member.role, "workspace:delete")) {
    throw new ForbiddenError("Only the workspace owner can delete it.");
  }

  const workspace = await getWorkspaceById(supabase, workspaceId);
  if (workspace.owner_id !== userId) {
    throw new ForbiddenError("Only the workspace owner can delete it.");
  }
  if (workspace.name.trim() !== confirmationName.trim()) {
    throw new ValidationError(
      "Type the workspace name exactly to confirm deletion.",
    );
  }

  const { count } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  if ((count ?? 0) <= 1) {
    throw new ForbiddenError(
      "You cannot delete your only workspace. Create another workspace first.",
    );
  }

  await writeAuditLog(supabase, {
    workspaceId,
    actorId: userId,
    action: "workspace_updated",
    summary: `Deleted workspace "${workspace.name}"`,
    resourceType: "workspace",
    resourceId: workspaceId,
  });

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId)
    .eq("owner_id", userId);
  if (error) throw mapError(error);
}

export interface WorkspaceUsage {
  memberCount: number;
  projectCount: number;
  apiKeyCount: number;
  aiMessageCount: number;
  errorCount: number;
  openIncidentCount: number;
}

export async function getWorkspaceUsage(
  supabase: Supabase,
  workspaceId: string,
): Promise<WorkspaceUsage> {
  const projectIdsRes = await supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", workspaceId);

  const projectIds = (projectIdsRes.data ?? []).map((p) => p.id);

  const [members, apiKeys, aiUsage, errors, incidents] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
    projectIds.length > 0
      ? supabase
          .from("api_keys")
          .select("id", { count: "exact", head: true })
          .in("project_id", projectIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ),
    projectIds.length > 0
      ? supabase
          .from("errors")
          .select("id", { count: "exact", head: true })
          .in("project_id", projectIds)
      : Promise.resolve({ count: 0 }),
    projectIds.length > 0
      ? supabase
          .from("incidents")
          .select("id", { count: "exact", head: true })
          .in("project_id", projectIds)
          .neq("status", "resolved")
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    memberCount: members.count ?? 0,
    projectCount: projectIds.length,
    apiKeyCount: apiKeys.count ?? 0,
    aiMessageCount: aiUsage.count ?? 0,
    errorCount: errors.count ?? 0,
    openIncidentCount: incidents.count ?? 0,
  };
}
