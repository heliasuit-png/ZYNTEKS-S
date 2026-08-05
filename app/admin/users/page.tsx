import type { Metadata } from "next";

import { listAdminUsers } from "@/services/admin/users.service";
import type { UsersListFilters } from "@/services/admin/users.types";
import type { SubscriptionPlan, UserStatus } from "@/types/database";
import { AdminContainer } from "@/features/admin";
import { UsersManagement } from "@/features/admin/components/users/users-management";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "User Management · ZYNTEKSIS Admin",
};

function pick(
  value: string | undefined,
): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export default async function AdminUsersPage({
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

  const filters: UsersListFilters = {
    q: pick(read("q")),
    role: (pick(read("role")) as UsersListFilters["role"]) ?? "",
    plan: (pick(read("plan")) as SubscriptionPlan | "") ?? "",
    status: (pick(read("status")) as UserStatus | "") ?? "",
    verified: (pick(read("verified")) as UsersListFilters["verified"]) ?? "",
    country: pick(read("country")),
    createdFrom: pick(read("createdFrom")),
    createdTo: pick(read("createdTo")),
    lastLoginFrom: pick(read("lastLoginFrom")),
    lastLoginTo: pick(read("lastLoginTo")),
    sort: (pick(read("sort")) as UsersListFilters["sort"]) ?? "created_at",
    direction: (pick(read("direction")) as UsersListFilters["direction"]) ?? "desc",
    page: Number(read("page") ?? "1") || 1,
    pageSize: Number(read("pageSize") ?? "20") || 20,
  };

  const result = await listAdminUsers(session.admin.role, filters);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) search.set(key, value);
  }

  return (
    <AdminContainer>
      <UsersManagement
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
