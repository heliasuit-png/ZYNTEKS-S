import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { API_KEY_ENVIRONMENTS, ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { listApiKeys } from "@/services/api-keys";
import { createSupabaseServerClient } from "@/supabase/server";
import { ApiKeyConnectionGuide } from "@/features/api-keys/components/connection-guide";
import { ApiKeysExplorer } from "@/features/api-keys/components/api-keys-explorer";
import type { ApiKeyStatus } from "@/types/database";

export const generateMetadata = () => dashboardPageMetadata("apiKeys");

const PAGE_SIZE = 9;
const STATUS_VALUES: readonly ApiKeyStatus[] = ["active", "revoked"];

interface ApiKeysPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    projectId?: string;
    environment?: string;
    status?: string;
  }>;
}

export default async function ApiKeysPage({
  searchParams,
}: ApiKeysPageProps) {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.apiKeys;
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const projectsPage = await listProjects(supabase, user.id, {
    page: 1,
    pageSize: 100,
  });
  const projects = projectsPage.items.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  const search = params.q?.trim() ?? "";
  const environment = API_KEY_ENVIRONMENTS.find(
    (value) => value === params.environment,
  );
  const status = STATUS_VALUES.find((value) => value === params.status);
  const projectId = params.projectId || undefined;

  const result = await listApiKeys(supabase, user.id, {
    page: params.page ? Number(params.page) : 1,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    projectId,
    environment,
    status,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <ApiKeyConnectionGuide hasProjects={projects.length > 0} />
      <ApiKeysExplorer
        apiKeys={result.items}
        projects={projects}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={search}
        filters={{
          projectId: params.projectId ?? "",
          environment: params.environment ?? "",
          status: params.status ?? "",
        }}
      />
    </div>
  );
}
