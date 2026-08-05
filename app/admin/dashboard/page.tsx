import type { Metadata } from "next";

import {
  getExecutiveDashboard,
  parseDashboardRange,
} from "@/services/admin/executive-dashboard.service";
import { AdminContainer } from "@/features/admin";
import { ExecutiveDashboard } from "@/features/admin/components/executive/executive-dashboard";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Executive Dashboard · ZYNTEKSIS Admin",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const range = parseDashboardRange(params.range);
  const data = await getExecutiveDashboard(session.admin.role, range);

  return (
    <AdminContainer>
      <ExecutiveDashboard data={data} role={session.admin.role} />
    </AdminContainer>
  );
}
