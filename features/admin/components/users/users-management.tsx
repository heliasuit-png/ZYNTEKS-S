"use client";

import { useState } from "react";

import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AdminUserListItem,
  UsersOverviewStats,
} from "@/services/admin/users.types";
import { UsersOverview } from "@/features/admin/components/users/users-overview";
import { UsersFilters } from "@/features/admin/components/users/users-filters";
import { UsersTable } from "@/features/admin/components/users/users-table";
import { UsersPagination } from "@/features/admin/components/users/users-pagination";
import { UserDrawer } from "@/features/admin/components/users/user-drawer";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";

interface UsersManagementProps {
  overview: UsersOverviewStats;
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
  search: string;
  role: AdminPlatformRole;
}

export function UsersManagement({
  overview,
  items,
  page,
  pageSize,
  total,
  search,
  role,
}: UsersManagementProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Directory"
        title="User Management"
        description="Platform-wide directory, security context, and administrative actions."
      />

      <UsersOverview stats={overview} />
      <UsersFilters />
      <UsersTable items={items} onOpen={setSelectedUserId} />
      <UsersPagination
        page={page}
        pageSize={pageSize}
        total={total}
        search={search}
      />
      <UserDrawer
        userId={selectedUserId}
        role={role}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
