"use client";

import { useState } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AdminWorkspaceListItem,
  WorkspacesOverviewStats,
} from "@/services/admin/workspaces.types";
import { WorkspacesOverview } from "@/features/admin/components/workspaces/workspaces-overview";
import { WorkspacesFilters } from "@/features/admin/components/workspaces/workspaces-filters";
import { WorkspacesTable } from "@/features/admin/components/workspaces/workspaces-table";
import { WorkspacesPagination } from "@/features/admin/components/workspaces/workspaces-pagination";
import { WorkspaceDrawer } from "@/features/admin/components/workspaces/workspace-drawer";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";

interface WorkspacesManagementProps {
  overview: WorkspacesOverviewStats;
  items: AdminWorkspaceListItem[];
  page: number;
  pageSize: number;
  total: number;
  search: string;
  role: AdminPlatformRole;
}

export function WorkspacesManagement({
  overview,
  items,
  page,
  pageSize,
  total,
  search,
  role,
}: WorkspacesManagementProps) {
  const { dict } = useDictionary();
  const t = dict.admin.workspaces;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={t.description}
      />

      <WorkspacesOverview stats={overview} />
      <WorkspacesFilters />
      <WorkspacesTable items={items} onOpen={setSelectedId} />
      <WorkspacesPagination
        page={page}
        pageSize={pageSize}
        total={total}
        search={search}
      />
      <WorkspaceDrawer
        workspaceId={selectedId}
        role={role}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
