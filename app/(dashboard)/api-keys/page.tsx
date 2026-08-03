import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { API_KEY_ENVIRONMENTS, ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { listApiKeys } from "@/services/api-keys";
import { createSupabaseServerClient } from "@/supabase/server";
import { ApiKeysExplorer } from "@/features/api-keys/components/api-keys-explorer";
import type { ApiKeyStatus } from "@/types/database";

export const metadata: Metadata = { title: "API Keys" };

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
      <PageHeader
        title="API Keys"
        description="Generate and manage keys used to authenticate API requests."
      />
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
