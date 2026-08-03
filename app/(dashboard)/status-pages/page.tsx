import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { FadeIn } from "@/components/dashboard/motion";
import { STATUS_PAGE_BASE_PATH } from "@/lib/constants";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/projects";
import { listStatusPages } from "@/services/status";
import { createSupabaseServerClient } from "@/supabase/server";
import { StatusPageManager } from "@/features/status/components/status-page-manager";
import type {
  StatusPageComponent,
  StatusPageMaintenance,
} from "@/services/status";

export const metadata: Metadata = { title: "Status Pages" };

export default async function StatusPagesPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);

  const pages = user ? await listStatusPages(supabase, user.id) : [];
  const projectsPage = user
    ? await listProjects(supabase, user.id, { page: 1, pageSize: 100 })
    : null;

  const pageProjectIds = new Set(pages.map((entry) => entry.page.project_id));
  const availableProjects = (projectsPage?.items ?? [])
    .filter((project) => !pageProjectIds.has(project.id))
    .map((project) => ({ id: project.id, name: project.name }));

  const components: Record<string, StatusPageComponent[]> = {};
  const maintenance: Record<string, StatusPageMaintenance[]> = {};
  if (user && pages.length > 0) {
    const [{ data: componentRows }, { data: maintenanceRows }] =
      await Promise.all([
        supabase
          .from("status_page_components")
          .select("*")
          .eq("user_id", user.id)
          .order("position", { ascending: true }),
        supabase
          .from("status_page_maintenance")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_start", { ascending: false }),
      ]);
    for (const component of componentRows ?? []) {
      const list = components[component.status_page_id] ?? [];
      list.push(component);
      components[component.status_page_id] = list;
    }
    for (const item of maintenanceRows ?? []) {
      const list = maintenance[item.status_page_id] ?? [];
      list.push(item);
      maintenance[item.status_page_id] = list;
    }
  }

  const publicBaseUrl = `${env.NEXT_PUBLIC_APP_URL}${STATUS_PAGE_BASE_PATH}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Status Pages"
        description="Publish public status pages with uptime, incidents, and maintenance."
      />
      <FadeIn>
        <StatusPageManager
          pages={pages.map((entry) => ({
            page: entry.page,
            projectName: entry.projectName,
          }))}
          components={components}
          maintenance={maintenance}
          availableProjects={availableProjects}
          publicBaseUrl={publicBaseUrl}
        />
      </FadeIn>
    </div>
  );
}
