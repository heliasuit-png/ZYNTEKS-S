import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/services/auth";
import {
  getWorkspaceById,
  getWorkspaceUsage,
  hasPermission,
  listUserWorkspaces,
  resolveActiveWorkspace,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import { OrganizationForm } from "@/features/workspace/components/organization-form";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";

export const generateMetadata = () => dashboardPageMetadata("organization");

export default async function OrganizationPage() {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.organization;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(DASHBOARD_ROUTES.dashboard);

  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );
  const [workspace, usage, workspaces] = await Promise.all([
    getWorkspaceById(supabase, active.id),
    getWorkspaceUsage(supabase, active.id),
    listUserWorkspaces(supabase, user.id),
  ]);

  const canManage = hasPermission(active.role, "settings:manage");
  const canDelete =
    workspace.owner_id === user.id &&
    hasPermission(active.role, "workspace:delete");
  const ownedWorkspaceCount = workspaces.filter(
    (item) => item.owner_id === user.id,
  ).length;
  const workspaceUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/w/${workspace.slug}`;
  const usageCopy = dict.dash.billingUi;
  const orgCopy = dict.dash.organization;

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />

      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageTile label={usageCopy.usageMembers} value={usage.memberCount} />
          <UsageTile label={usageCopy.usageProjects} value={usage.projectCount} />
          <UsageTile label={usageCopy.usageApiKeys} value={usage.apiKeyCount} />
          <UsageTile
            label={usageCopy.usageAiMessages}
            value={usage.aiMessageCount}
          />
        </div>
      </FadeIn>

      <OrganizationForm
        workspace={workspace}
        canManage={canManage}
        canDelete={canDelete}
        workspaceUrl={workspaceUrl}
        workspaceCount={ownedWorkspaceCount}
      />

      <FadeIn delay={0.05}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{orgCopy.metadataTitle}</PanelTitle>
          </PanelHeader>
          <PanelContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Meta label={orgCopy.yourRole} value={active.role} />
            <Meta label={orgCopy.plan} value={workspace.plan} />
            <Meta
              label={orgCopy.created}
              value={new Date(workspace.created_at).toLocaleString()}
            />
            <Meta label={orgCopy.workspaceId} value={workspace.id} />
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function UsageTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="zt-card rounded-2xl border border-zt-border p-4">
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zt-text">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-0.5 break-all text-zt-text">{value}</p>
    </div>
  );
}
