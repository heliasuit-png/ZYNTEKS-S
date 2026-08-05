import type { Metadata } from "next";

import { getEnterpriseAuditCenter } from "@/services/admin/audit-center.service";
import type {
  AuditCategory,
  AuditFilters,
  AuditResult,
  AuditSeverity,
} from "@/services/admin/audit-center.types";
import type { AdminAuditAction, AdminPlatformRole } from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { EnterpriseAuditCenter } from "@/features/admin/components/audit/enterprise-audit-center";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Enterprise Audit Center · ZYNTEKSIS Admin",
};

export const dynamic = "force-dynamic";

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminAuditPage({
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

  const pageRaw = Number(pick(read("page")) ?? "1");
  const pageSizeRaw = Number(pick(read("pageSize")) ?? "50");

  const filters: AuditFilters = {
    q: pick(read("q")),
    range: (pick(read("range")) as AuditFilters["range"]) ?? "30d",
    from: pick(read("from")),
    to: pick(read("to")),
    severity: (pick(read("severity")) as AuditSeverity | "") ?? "",
    category: (pick(read("category")) as AuditCategory | "") ?? "",
    actorRole: (pick(read("actorRole")) as AdminPlatformRole | "") ?? "",
    workspaceId: pick(read("workspaceId")),
    projectId: pick(read("projectId")),
    result: (pick(read("result")) as AuditResult | "") ?? "",
    action: (pick(read("action")) as AdminAuditAction | "") ?? "",
    page: Number.isFinite(pageRaw) ? pageRaw : 1,
    pageSize: Number.isFinite(pageSizeRaw) ? pageSizeRaw : 50,
  };

  const data = await getEnterpriseAuditCenter(session.admin.role, filters);

  return (
    <AdminContainer>
      <EnterpriseAuditCenter data={data} />
    </AdminContainer>
  );
}
