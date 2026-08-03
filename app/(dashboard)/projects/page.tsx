import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { createSupabaseServerClient } from "@/supabase/server";
import { ProjectsExplorer } from "@/features/projects/components/projects-explorer";

export const metadata: Metadata = { title: "Projects" };

const PAGE_SIZE = 9;

interface ProjectsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
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
      <PageHeader
        title="Projects"
        description="Create and manage the projects in your workspace."
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
