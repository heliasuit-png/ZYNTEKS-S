import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { createSupabaseServerClient } from "@/supabase/server";
import { ProjectsExplorer } from "@/features/projects/components/projects-explorer";

export const generateMetadata = () => dashboardPageMetadata("projects");

const PAGE_SIZE = 9;

interface ProjectsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.projects;
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const search = params.q?.trim() ?? "";
  const result = await listProjects(supabase, user.id, {
    page: params.page ? Number(params.page) : 1,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <ProjectsExplorer
        projects={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={search}
      />
    </div>
  );
}
