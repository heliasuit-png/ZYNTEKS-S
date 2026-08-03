import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { FadeIn } from "@/components/dashboard/motion";
import {
  API_KEY_ENVIRONMENTS,
  ROUTES,
} from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import {
  getErrorAnalytics,
  listErrors,
} from "@/services/dashboard/errors.service";
import { listProjects } from "@/services/dashboard/projects.service";
import { createSupabaseServerClient } from "@/supabase/server";
import { ErrorsExplorer } from "@/features/errors/components/errors-explorer";
import { ErrorAnalyticsStrip } from "@/features/errors/components/error-analytics";
import type { EventLevel } from "@/types/database";

export const metadata: Metadata = { title: "Error Monitoring" };

const PAGE_SIZE = 20;
const LEVELS: EventLevel[] = ["debug", "info", "warning", "error", "fatal"];

interface ErrorsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    projectId?: string;
    environment?: string;
    level?: string;
    release?: string;
    activity?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ErrorsPage({ searchParams }: ErrorsPageProps) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const search = params.q?.trim() ?? "";
  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === params.environment,
  );
  const level = LEVELS.find((value) => value === params.level);
  const activity =
    params.activity === "unresolved" || params.activity === "resolved"
      ? params.activity
      : undefined;
  const projectId = params.projectId || undefined;
  const release = params.release?.trim() || undefined;

  const from = params.from
    ? new Date(`${params.from}T00:00:00.000Z`).toISOString()
    : undefined;
  const to = params.to
    ? new Date(`${params.to}T23:59:59.999Z`).toISOString()
    : undefined;

  const [result, projectsPage, analytics] = await Promise.all([
    listErrors({
      page: params.page ? Number(params.page) : 1,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      projectId,
      environment,
      level,
      release,
      activity,
      from,
      to,
    }),
    listProjects({ page: 1, pageSize: 100 }),
    getErrorAnalytics(),
  ]);

  const projects = projectsPage.items.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Error Monitoring"
        description="Track, group, and triage errors captured across your projects."
      />

      <FadeIn>
        <ErrorAnalyticsStrip analytics={analytics} />
      </FadeIn>

      <ErrorsExplorer
        errors={result.items}
        projects={projects}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={search}
        filters={{
          projectId: params.projectId ?? "",
          environment: params.environment ?? "",
          level: params.level ?? "",
          release: params.release ?? "",
          activity: params.activity ?? "",
          from: params.from ?? "",
          to: params.to ?? "",
        }}
      />
    </div>
  );
}
