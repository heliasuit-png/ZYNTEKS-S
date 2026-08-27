import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

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

export const generateMetadata = () => dashboardPageMetadata("members");

export default async function MembersPage() {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.members;
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
      <PageHeader title={pageCopy.title} description={pageCopy.description} />
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
