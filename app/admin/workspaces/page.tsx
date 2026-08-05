import type { Metadata } from "next";

import { listAdminWorkspaces } from "@/services/admin/workspaces.service";
import type { WorkspacesListFilters } from "@/services/admin/workspaces.types";
import type {
  SubscriptionPlan,
  WorkspaceAdminStatus,
} from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { WorkspacesManagement } from "@/features/admin/components/workspaces/workspaces-management";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Workspace Command Center · ZYNTEKSIS Admin",
};

function pick(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function pickNumber(value: string | undefined): number | "" {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export default async function AdminWorkspacesPage({
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

  const filters: WorkspacesListFilters = {
    q: pick(read("q")),
    plan: (pick(read("plan")) as SubscriptionPlan | "") ?? "",
    status: (pick(read("status")) as WorkspaceAdminStatus | "") ?? "",
    country: pick(read("country")),
    createdFrom: pick(read("createdFrom")),
    createdTo: pick(read("createdTo")),
    storage:
      (pick(read("storage")) as WorkspacesListFilters["storage"]) ?? "",
    membersMin: pickNumber(read("membersMin")),
    membersMax: pickNumber(read("membersMax")),
    sort: (pick(read("sort")) as WorkspacesListFilters["sort"]) ?? "created_at",
    direction:
      (pick(read("direction")) as WorkspacesListFilters["direction"]) ?? "desc",
    page: Number(read("page") ?? "1") || 1,
    pageSize: Number(read("pageSize") ?? "20") || 20,
  };

  const result = await listAdminWorkspaces(session.admin.role, filters);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) search.set(key, value);
  }

  return (
    <AdminContainer>
      <WorkspacesManagement
        overview={result.overview}
        items={result.items}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        search={search.toString()}
        role={session.admin.role}
      />
    </AdminContainer>
  );
}
