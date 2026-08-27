import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import { PageHeader } from "@/components/dashboard/page-header";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import {
  exportAuditLogsCsv,
  listAuditLogs,
  resolveActiveWorkspace,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";

const AuditView = dynamic(
  () =>
    import("@/features/workspace/components/audit-view").then((m) => m.AuditView),
  { ssr: true },
);

export const generateMetadata = () => dashboardPageMetadata("audit");

export default async function AuditPage() {
  const { dict } = await getDictionary();
  const pageCopy = dict.dashboard.pageTitles.audit;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) redirect(DASHBOARD_ROUTES.dashboard);

  const { active } = await resolveActiveWorkspace(
    supabase,
    user.id,
    user.email,
  );

  const [page, csv] = await Promise.all([
    listAuditLogs(supabase, {
      workspaceId: active.id,
      page: 1,
      pageSize: 100,
    }),
    exportAuditLogsCsv(supabase, active.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={pageCopy.title} description={pageCopy.description}
      />
      <AuditView logs={page.items} csv={csv} />
    </div>
  );
}
