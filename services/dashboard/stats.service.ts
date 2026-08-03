import { getHealthSummary } from "@/services/dashboard/health.service";
import { getOpenIncidentCount } from "@/services/dashboard/incidents.service";
import { listErrors } from "@/services/dashboard/errors.service";
import { listProjects } from "@/services/dashboard/projects.service";
import { getAuthenticatedUser } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";
import type { DashboardStats } from "@/types/dashboard";

/**
 * Aggregates the headline dashboard statistics from live resource services.
 * `apiRequestsToday` counts SDK ingest rows (heartbeats + performance + errors)
 * created in the last 24 hours for the authenticated user's projects.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [projects, errors, openIncidents, health, ingestToday] =
    await Promise.all([
      listProjects({ page: 1, pageSize: 100 }),
      listErrors({ page: 1, pageSize: 1 }),
      getOpenIncidentCount(),
      getHealthSummary(),
      countSdkIngestToday(),
    ]);

  const activeProjects = projects.items.filter(
    (project) => project.status === "active",
  ).length;

  return {
    totalProjects: projects.total,
    activeProjects,
    apiRequestsToday: ingestToday,
    errorsToday: errors.total,
    healthScore: health.score,
    openIncidents,
  };
}

async function countSdkIngestToday(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return 0;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: projectRows } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id);

    const projectIds = (projectRows ?? []).map((row) => row.id);
    if (projectIds.length === 0) return 0;

    const [heartbeats, performance, errorRows] = await Promise.all([
      supabase
        .from("heartbeats")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .gte("created_at", since),
      supabase
        .from("performance_logs")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .gte("created_at", since),
      supabase
        .from("errors")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .gte("created_at", since),
    ]);

    return (
      (heartbeats.count ?? 0) +
      (performance.count ?? 0) +
      (errorRows.count ?? 0)
    );
  } catch {
    return 0;
  }
}
