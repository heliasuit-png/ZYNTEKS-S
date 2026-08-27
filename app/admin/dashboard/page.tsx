import type { Metadata } from "next";

import {
  getExecutiveDashboard,
  parseDashboardRange,
} from "@/services/admin/executive-dashboard.service";
import { AdminContainer } from "@/features/admin";
import { ExecutiveDashboard } from "@/features/admin/components/executive/executive-dashboard";
import { requireAdminSession } from "@/features/admin/load-admin-session";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: `${dict.admin.executive.title}${dict.admin.common.metaTitleSuffix}`,
  };
}

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
