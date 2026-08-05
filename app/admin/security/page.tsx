import type { Metadata } from "next";

import { getSecurityCenter } from "@/services/admin/security-center.service";
import type { SecurityCenterFilters } from "@/services/admin/security-center.types";
import type { AdminPlatformRole } from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { SecurityCenter } from "@/features/admin/components/security/security-center";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Enterprise Security Center · ZYNTEKSIS Admin",
};

export const dynamic = "force-dynamic";

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminSecurityPage({
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

  const filters: SecurityCenterFilters = {
    q: pick(read("q")),
    severity:
      (pick(read("severity")) as SecurityCenterFilters["severity"]) ?? "",
    eventType:
      (pick(read("eventType")) as SecurityCenterFilters["eventType"]) ?? "",
    from: pick(read("from")),
    to: pick(read("to")),
    range: (pick(read("range")) as SecurityCenterFilters["range"]) ?? "24h",
    role: (pick(read("role")) as AdminPlatformRole | "") ?? "",
    workspaceId: pick(read("workspaceId")),
  };

  const data = await getSecurityCenter(session.admin.role, filters);

  return (
    <AdminContainer>
      <SecurityCenter data={data} role={session.admin.role} />
    </AdminContainer>
  );
}
