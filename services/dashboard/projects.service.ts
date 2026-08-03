import { emptyPage } from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects as listUserProjects } from "@/services/projects";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Paginated, PaginationParams, Project } from "@/types/dashboard";

/**
 * Dashboard overview seam for projects. Reads the current user's projects from
 * the `projects` table and maps them to the dashboard view model. Falls back to
 * an empty page if there is no active session.
 */
export async function listProjects(
  params?: Partial<PaginationParams>,
): Promise<Paginated<Project>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return emptyPage<Project>(params);
    }

    const result = await listUserProjects(supabase, user.id, params);
    const items: Project[] = result.items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch {
    return emptyPage<Project>(params);
  }
}
