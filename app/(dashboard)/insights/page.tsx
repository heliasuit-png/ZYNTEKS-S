import Link from "next/link";
import { redirect } from "next/navigation";
import { BrainCircuit, FolderPlus } from "lucide-react";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects/project.service";
import { getProjectIntelligence } from "@/services/intelligence";
import { createSupabaseServerClient } from "@/supabase/server";
import { InsightsView } from "@/features/insights/components/insights-view";

export const generateMetadata = () => dashboardPageMetadata("insights");

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.insights;
  const { p: requestedId } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(DASHBOARD_ROUTES.dashboard);
  }

  const projectsPage = await listProjects(supabase, user.id, {
    page: 1,
    pageSize: 100,
  });
  const projects = projectsPage.items.map((p) => ({ id: p.id, name: p.name }));

  const header = (
    <PageHeader title={pageCopy.title} description={pageCopy.description}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={BrainCircuit}
          title={dict.dash.insights.emptyTitle}
          description={dict.dash.insights.emptyDesc}
          action={
            <Link
              href={DASHBOARD_ROUTES.projects}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-zt-primary to-zt-purple px-4 py-2 text-sm font-medium text-white shadow-[0_8px_30px_-12px_var(--color-zt-primary)] transition-transform hover:scale-[1.02]"
            >
              <FolderPlus className="size-4" aria-hidden />
              {dict.dash.insights.createProject}
            </Link>
          }
        />
      </div>
    );
  }

  const validId = projects.some((p) => p.id === requestedId)
    ? requestedId!
    : projects[0]!.id;

  const data = await getProjectIntelligence(supabase, user.id, validId);

  if (!data) {
    // Requested project vanished or is not owned; fall back to the first one.
    redirect(DASHBOARD_ROUTES.insights);
  }

  return (
    <div className="space-y-6">
      {header}
      <InsightsView projects={projects} selectedId={validId} data={data} />
    </div>
  );
}
