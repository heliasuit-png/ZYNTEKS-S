import type { Metadata } from "next";

import { getAiOperations } from "@/services/admin/ai-operations.service";
import type { AiOpsFilters } from "@/services/admin/ai-operations.types";
import { AdminContainer } from "@/features/admin";
import { AiOperationsCenter } from "@/features/admin/components/ai/ai-operations-center";
import { requireAdminSession } from "@/features/admin/load-admin-session";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: `${dict.admin.ai.pageTitle}${dict.admin.common.metaTitleSuffix}`,
  };
}

export const dynamic = "force-dynamic";

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminAiPage({
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

  const filters: AiOpsFilters = {
    range: (pick(read("range")) as AiOpsFilters["range"]) ?? "30d",
    from: pick(read("from")),
    to: pick(read("to")),
    workspaceId: pick(read("workspaceId")),
    projectId: pick(read("projectId")),
    model: pick(read("model")),
    environment: pick(read("environment")),
  };

  const data = await getAiOperations(session.admin.role, filters);

  return (
    <AdminContainer>
      <AiOperationsCenter data={data} />
    </AdminContainer>
  );
}
