import type { Metadata } from "next";

import { getAnalyticsIntelligence } from "@/services/admin/analytics-intelligence.service";
import type { AnalyticsFilters } from "@/services/admin/analytics-intelligence.types";
import type { ApiKeyEnvironment } from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { AnalyticsIntelligence } from "@/features/admin/components/analytics/analytics-intelligence";
import { requireAdminSession } from "@/features/admin/load-admin-session";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: `${dict.admin.analytics.pageTitle}${dict.admin.common.metaTitleSuffix}`,
  };
}

export const dynamic = "force-dynamic";

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;

  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };

  const filters: AnalyticsFilters = {
    range: (pick(read("range")) as AnalyticsFilters["range"]) ?? "30d",
    from: pick(read("from")),
    to: pick(read("to")),
    workspaceId: pick(read("workspaceId")),
    projectId: pick(read("projectId")),
    country: pick(read("country")),
    environment:
      (pick(read("environment")) as ApiKeyEnvironment | "") ?? "",
  };

  const data = await getAnalyticsIntelligence(session.admin.role, filters);

  return (
    <AdminContainer>
      <AnalyticsIntelligence data={data} />
    </AdminContainer>
  );
}
