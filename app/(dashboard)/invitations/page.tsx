import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAuthenticatedUser } from "@/services/auth";
import {
  getWorkspaceById,
  listPendingInvitationsForEmail,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import { InvitationsClient } from "@/features/workspace/components/invitations-client";
import { formatRelativeTime } from "@/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.dash.members.invitationsTitle };
}

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { dict, locale } = await getDictionary();
  const copy = dict.dash.members;
  const { token } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user?.email) redirect(DASHBOARD_ROUTES.dashboard);

  const pending = await listPendingInvitationsForEmail(supabase, user.email);
  const enriched = await Promise.all(
    pending.map(async (inv) => {
      let workspaceName = copy.workspaceFallback;
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
        roleLabel: copy.roles[inv.role] ?? inv.role,
        workspaceName,
        expiresLabel: formatRelativeTime(inv.expires_at, undefined, locale),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={copy.invitationsTitle} description={copy.invitationsDesc} />
      <InvitationsClient invitations={enriched} highlightToken={token} />
    </div>
  );
}
