import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrainCircuit, FolderPlus } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects/project.service";
import { getProjectIntelligence } from "@/services/intelligence";
import { createSupabaseServerClient } from "@/supabase/server";
import { InsightsView } from "@/features/insights/components/insights-view";

export const metadata: Metadata = { title: "Monitoring Intelligence" };

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
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
    <PageHeader
      title="Monitoring Intelligence"
      description="Autonomous detection, correlation and recommendations across your telemetry."
    />
  );

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={BrainCircuit}
          title="No projects to analyze yet"
          description="Create a project and install the SDK to unlock autonomous monitoring intelligence — health scoring, anomaly detection, correlation and recommendations."
          action={
            <Link
              href={DASHBOARD_ROUTES.projects}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-zt-primary to-zt-purple px-4 py-2 text-sm font-medium text-white shadow-[0_8px_30px_-12px_var(--color-zt-primary)] transition-transform hover:scale-[1.02]"
            >
              <FolderPlus className="size-4" aria-hidden />
              Create a project
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
