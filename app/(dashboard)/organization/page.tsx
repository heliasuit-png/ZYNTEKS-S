import type { Metadata } from "next";
import { redirect } from "next/navigation";

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

export const metadata: Metadata = { title: "Organization" };

export default async function OrganizationPage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Workspace branding, defaults and security policies for your company."
      />

      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageTile label="Members" value={usage.memberCount} />
          <UsageTile label="Projects" value={usage.projectCount} />
          <UsageTile label="API keys" value={usage.apiKeyCount} />
          <UsageTile label="AI messages (30d)" value={usage.aiMessageCount} />
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
            <PanelTitle>Workspace metadata</PanelTitle>
          </PanelHeader>
          <PanelContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Meta label="Your role" value={active.role} />
            <Meta label="Plan" value={workspace.plan} />
            <Meta
              label="Created"
              value={new Date(workspace.created_at).toLocaleString()}
            />
            <Meta label="Workspace ID" value={workspace.id} />
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
