import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES, WORKSPACE_ROLE_LABELS } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import {
  getWorkspaceById,
  listPendingInvitationsForEmail,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import { InvitationsClient } from "@/features/workspace/components/invitations-client";
import { formatRelativeTime } from "@/utils/format";

export const metadata: Metadata = { title: "Invitations" };

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user?.email) redirect(DASHBOARD_ROUTES.dashboard);

  const pending = await listPendingInvitationsForEmail(supabase, user.email);
  const enriched = await Promise.all(
    pending.map(async (inv) => {
      let workspaceName = "Workspace";
      try {
        const ws = await getWorkspaceById(supabase, inv.workspace_id);
        workspaceName = ws.name;
      } catch {
        // ignore
      }
      return {
        id: inv.id,
        token: inv.token,
        email: inv.email,
        roleLabel: WORKSPACE_ROLE_LABELS[inv.role],
        workspaceName,
        expiresLabel: formatRelativeTime(inv.expires_at),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Accept or decline pending workspace invitations sent to your email."
      />
      <InvitationsClient invitations={enriched} highlightToken={token} />
    </div>
  );
}
