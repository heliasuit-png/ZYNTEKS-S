import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import {
  hasPermission,
  listInvitations,
  listMembers,
  resolveActiveWorkspace,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";

const MembersView = dynamic(
  () =>
    import("@/features/workspace/components/members-view").then((m) => m.MembersView),
  { ssr: true },
);

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(DASHBOARD_ROUTES.dashboard);

  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );

  const [members, invitations] = await Promise.all([
    listMembers(supabase, active.id, user.id),
    listInvitations(supabase, active.id, user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team members"
        description={`Manage people in ${active.name}. Roles control project, API, billing and AI access.`}
      />
      <MembersView
        workspaceId={active.id}
        members={members}
        invitations={invitations}
        canManage={hasPermission(active.role, "members:invite")}
        currentUserId={user.id}
      />
    </div>
  );
}
