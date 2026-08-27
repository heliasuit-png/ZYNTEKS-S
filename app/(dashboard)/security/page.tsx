import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import {
  getRecentLogins,
  getWorkspaceUsage,
  listSessions,
  resolveActiveWorkspace,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Json } from "@/types/database";

const SecurityView = dynamic(
  () =>
    import("@/features/workspace/components/security-view").then(
      (m) => m.SecurityView,
    ),
  { ssr: true },
);

export const generateMetadata = () => dashboardPageMetadata("security");

function readRequire2fa(policies: Json): boolean {
  if (!policies || typeof policies !== "object" || Array.isArray(policies)) {
    return false;
  }
  return Boolean((policies as { require_2fa?: boolean }).require_2fa);
}

export default async function SecurityPage() {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.security;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(DASHBOARD_ROUTES.dashboard);

  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );

  const [sessions, recentLogins, usage, profile] = await Promise.all([
    listSessions(supabase, user.id),
    getRecentLogins(supabase, user.id, 12),
    getWorkspaceUsage(supabase, active.id),
    getProfileById(supabase, user.id).catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <SecurityView
        sessions={sessions}
        recentLogins={recentLogins}
        apiKeyCount={usage.apiKeyCount}
        twoFactorPolicyEnabled={readRequire2fa(active.security_policies)}
        passwordChangedAt={profile?.password_changed_at ?? null}
      />
    </div>
  );
}
