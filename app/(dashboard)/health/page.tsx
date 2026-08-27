import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { API_KEY_ENVIRONMENTS, ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getHealthDashboard } from "@/services/dashboard/health.service";
import { listProjects } from "@/services/dashboard/projects.service";
import { createSupabaseServerClient } from "@/supabase/server";
import { HealthExplorer } from "@/features/health/components/health-explorer";
import type { HealthStatus } from "@/features/health/types";

export const generateMetadata = () => dashboardPageMetadata("health");

const STATUSES: HealthStatus[] = [
  "healthy",
  "warning",
  "critical",
  "recovered",
  "investigating",
];

interface HealthPageProps {
  searchParams: Promise<{
    q?: string;
    projectId?: string;
    environment?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function HealthPage({ searchParams }: HealthPageProps) {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.health;
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === params.environment,
  );
  const status = STATUSES.find((value) => value === params.status);
  const from = params.from
    ? new Date(`${params.from}T00:00:00.000Z`).toISOString()
    : undefined;
  const to = params.to
    ? new Date(`${params.to}T23:59:59.999Z`).toISOString()
    : undefined;

  const [data, projectsPage] = await Promise.all([
    getHealthDashboard({
      search: params.q?.trim() || undefined,
      projectId: params.projectId || undefined,
      environment,
      status,
      from,
      to,
    }),
    listProjects({ page: 1, pageSize: 100 }),
  ]);

  const projects = projectsPage.items.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <HealthExplorer
        data={data}
        projects={projects}
        search={params.q?.trim() ?? ""}
        filters={{
          projectId: params.projectId ?? data.selectedProjectId ?? "",
          environment: params.environment ?? "",
          status: params.status ?? "",
          from: params.from ?? "",
          to: params.to ?? "",
        }}
      />
    </div>
  );
}
