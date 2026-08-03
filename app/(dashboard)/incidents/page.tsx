import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  API_KEY_ENVIRONMENTS,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  ROUTES,
} from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listIncidents } from "@/services/dashboard/incidents.service";
import { listProjects } from "@/services/dashboard/projects.service";
import { createSupabaseServerClient } from "@/supabase/server";
import { IncidentsExplorer } from "@/features/incidents/components/incidents-explorer";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

export const metadata: Metadata = { title: "Incidents" };

const PAGE_SIZE = 20;
const SORTS = ["started_at", "severity", "status", "resolved_at"] as const;

interface IncidentsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    projectId?: string;
    environment?: string;
    status?: string;
    severity?: string;
    from?: string;
    to?: string;
    sort?: string;
    sortDir?: string;
  }>;
}

export default async function IncidentsPage({
  searchParams,
}: IncidentsPageProps) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const status = INCIDENT_STATUSES.find((v) => v === params.status) as
    | IncidentStatus
    | undefined;
  const severity = INCIDENT_SEVERITIES.find((v) => v === params.severity) as
    | IncidentSeverity
    | undefined;
  const environment = API_KEY_ENVIRONMENTS.find(
    (v) => v === params.environment,
  );
  const sort = SORTS.find((v) => v === params.sort) ?? "started_at";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  const from = params.from
    ? new Date(`${params.from}T00:00:00.000Z`).toISOString()
    : undefined;
  const to = params.to
    ? new Date(`${params.to}T23:59:59.999Z`).toISOString()
    : undefined;

  const [result, projectsPage] = await Promise.all([
    listIncidents({
      page: params.page ? Number(params.page) : 1,
      pageSize: PAGE_SIZE,
      search: params.q?.trim() || undefined,
      projectId: params.projectId || undefined,
      environment,
      status,
      severity,
      from,
      to,
      sort,
      sortDir,
    }),
    listProjects({ page: 1, pageSize: 100 }),
  ]);

  const projects = projectsPage.items.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Investigate outages, track recovery, and manage incident response."
      />
      <IncidentsExplorer
        incidents={result.items}
        projects={projects}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={params.q?.trim() ?? ""}
        filters={{
          projectId: params.projectId ?? "",
          environment: params.environment ?? "",
          status: params.status ?? "",
          severity: params.severity ?? "",
          from: params.from ?? "",
          to: params.to ?? "",
          sort,
          sortDir,
        }}
      />
    </div>
  );
}
