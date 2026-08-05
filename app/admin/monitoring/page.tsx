import type { Metadata } from "next";

import { getMonitoringMissionControl } from "@/services/admin/monitoring-mission.service";
import type { MonitoringMissionFilters } from "@/services/admin/monitoring-mission.types";
import type { ApiKeyEnvironment } from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { MonitoringMissionControl } from "@/features/admin/components/monitoring/monitoring-mission-control";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Monitoring Mission Control · ZYNTEKSIS Admin",
};

export const dynamic = "force-dynamic";

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminMonitoringPage({
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

  const filters: MonitoringMissionFilters = {
    workspaceId: pick(read("workspaceId")),
    projectId: pick(read("projectId")),
    country: pick(read("country")),
    environment:
      (pick(read("environment")) as ApiKeyEnvironment | "") ?? "",
    from: pick(read("from")),
    to: pick(read("to")),
    range:
      (pick(read("range")) as MonitoringMissionFilters["range"]) ?? "24h",
    severity: (pick(read("severity")) as MonitoringMissionFilters["severity"]) ?? "",
  };

  const data = await getMonitoringMissionControl(session.admin.role, filters);

  return (
    <AdminContainer>
      <MonitoringMissionControl data={data} />
    </AdminContainer>
  );
}
