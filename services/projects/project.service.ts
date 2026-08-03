import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { mapPostgrestError as toAppErrorFromPostgrest } from "@/lib/map-postgrest-error";
import { slugify } from "@/utils/string";
import {
  createPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import {
  getPlanLimits,
  getSubscriptionPlan,
} from "@/services/account/plan.service";
import {
  ensureUserWorkspaces,
  requireMembership,
} from "@/services/workspace/workspace.service";
import { hasPermission } from "@/services/workspace/permissions";
import { writeAuditLog } from "@/services/workspace/audit.service";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database, ProjectFramework, ProjectStatus } from "@/types/database";
import type { Paginated, PaginationParams } from "@/types/dashboard";

/**
 * Project service. Encapsulates all access to the `projects` table. All reads
 * and writes are scoped to a user id and further protected by Row Level
 * Security. Callers inject a Supabase client.
 */

type Supabase = TypedSupabaseClient;

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

function mapPostgrestError(error: Parameters<typeof toAppErrorFromPostgrest>[0]) {
  return toAppErrorFromPostgrest(error, {
    uniqueConflictMessage: "A project with that slug already exists.",
  });
}

export interface ListProjectsParams extends Partial<PaginationParams> {
  search?: string;
  status?: ProjectStatus;
  /** When set, lists all projects in the workspace (RBAC via RLS). */
  workspaceId?: string;
}

export async function listProjects(
  supabase: Supabase,
  userId: string,
  params: ListProjectsParams = {},
): Promise<Paginated<Project>> {
  const pagination = normalizePagination(params);
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = supabase.from("projects").select("*", { count: "exact" });

  if (params.workspaceId) {
    query = query.eq("workspace_id", params.workspaceId);
  } else {
    query = query.eq("user_id", userId);
  }

  const search = params.search?.trim();
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw mapPostgrestError(error);
  }

  return createPage(data ?? [], count ?? 0, pagination);
}

export async function countProjects(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw mapPostgrestError(error);
  }
  return count ?? 0;
}

export async function getProjectById(
  supabase: Supabase,
  _userId: string,
  id: string,
): Promise<Project> {
  // Access is enforced by workspace-aware RLS; userId kept for call-site compat.
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    throw new NotFoundError("Project not found");
  }
  return data;
}

async function slugExists(
  supabase: Supabase,
  userId: string,
  slug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  return data !== null;
}

async function generateUniqueSlug(
  supabase: Supabase,
  userId: string,
  source: string,
): Promise<string> {
  const base = slugify(source) || "project";
  let candidate = base;
  let suffix = 1;

  // Bounded loop guards against pathological collisions.
  while (suffix < 1000 && (await slugExists(supabase, userId, candidate))) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string | null;
  framework: ProjectFramework;
  productionUrl?: string | null;
  stagingUrl?: string | null;
  status?: ProjectStatus;
  workspaceId?: string;
}

export async function createProject(
  supabase: Supabase,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const workspaces = await ensureUserWorkspaces(supabase, userId);
  const workspaceId = input.workspaceId ?? workspaces[0]?.id;
  if (!workspaceId) {
    throw new ForbiddenError("No workspace available to create a project in.");
  }

  const membership = await requireMembership(supabase, workspaceId, userId);
  if (!hasPermission(membership.role, "projects:create")) {
    throw new ForbiddenError("You do not have permission to create projects.");
  }

  const plan = await getSubscriptionPlan(supabase, userId);
  const limits = getPlanLimits(plan);
  const { count: workspaceProjectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if ((workspaceProjectCount ?? 0) >= limits.projects) {
    throw new ForbiddenError(
      `Your ${plan} plan allows up to ${limits.projects} projects. Upgrade to create more.`,
    );
  }

  const slug = await generateUniqueSlug(
    supabase,
    userId,
    input.slug?.trim() || input.name,
  );

  const payload: ProjectInsert = {
    user_id: userId,
    workspace_id: workspaceId,
    name: input.name.trim(),
    slug,
    description: input.description ?? null,
    framework: input.framework,
    production_url: input.productionUrl ?? null,
    staging_url: input.stagingUrl ?? null,
    status: input.status ?? "active",
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }

  await writeAuditLog(supabase, {
    workspaceId,
    actorId: userId,
    action: "project_created",
    summary: `Created project "${data.name}"`,
    resourceType: "project",
    resourceId: data.id,
  });

  return data;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  framework?: ProjectFramework;
  productionUrl?: string | null;
  stagingUrl?: string | null;
  status?: ProjectStatus;
}

export async function updateProject(
  supabase: Supabase,
  userId: string,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const payload: ProjectUpdate = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description;
  if (input.framework !== undefined) payload.framework = input.framework;
  if (input.productionUrl !== undefined)
    payload.production_url = input.productionUrl;
  if (input.stagingUrl !== undefined) payload.staging_url = input.stagingUrl;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }
  if (!data) {
    throw new NotFoundError("Project not found");
  }
  return data;
}

export async function deleteProject(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw mapPostgrestError(error);
  }
}
