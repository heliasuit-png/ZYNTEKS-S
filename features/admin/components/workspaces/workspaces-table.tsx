"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { AdminWorkspaceListItem } from "@/services/admin/workspaces.types";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const COLUMNS: { key: string; label: string; sort?: string }[] = [
  { key: "logo", label: "Logo" },
  { key: "name", label: "Workspace", sort: "name" },
  { key: "owner", label: "Owner", sort: "owner" },
  { key: "members", label: "Members", sort: "members" },
  { key: "projects", label: "Projects", sort: "projects" },
  { key: "api_keys", label: "API Keys", sort: "api_keys" },
  { key: "errors", label: "Errors", sort: "errors" },
  { key: "incidents", label: "Incidents", sort: "incidents" },
  { key: "plan", label: "Plan", sort: "plan" },
  { key: "storage", label: "Storage", sort: "storage" },
  { key: "status", label: "Status", sort: "status" },
  { key: "created_at", label: "Created", sort: "created_at" },
  { key: "actions", label: "Actions" },
];

interface WorkspacesTableProps {
  items: AdminWorkspaceListItem[];
  onOpen: (workspaceId: string) => void;
}

export function WorkspacesTable({ items, onOpen }: WorkspacesTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "created_at";
  const direction = searchParams.get("direction") ?? "desc";

  function sortHref(field: string) {
    const params = new URLSearchParams(searchParams.toString());
    const nextDir = sort === field && direction === "asc" ? "desc" : "asc";
    params.set("sort", field);
    params.set("direction", nextDir);
    return `${pathname}?${params.toString()}`;
  }

  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="No workspaces match these filters"
        description="Adjust search or filters to broaden results."
      />
    );
  }

  return (
    <div className="admin-glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-muted)]">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-3 py-3 font-medium">
                  {column.sort ? (
                    <Link
                      href={sortHref(column.sort)}
                      className="hover:text-[var(--admin-text)]"
                    >
                      {column.label}
                      {sort === column.sort
                        ? direction === "asc"
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </Link>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((workspace) => (
              <tr
                key={workspace.id}
                className="border-b border-[var(--admin-border)]/70 transition-colors hover:bg-[var(--admin-surface)]"
              >
                <td className="px-3 py-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold"
                    style={{
                      background: `${workspace.brandColor}33`,
                      color: workspace.brandColor,
                    }}
                  >
                    {workspace.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={workspace.logoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      workspace.name[0]?.toUpperCase() ?? "?"
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpen(workspace.id)}
                    className="text-left text-[var(--admin-text)] hover:text-[var(--admin-accent)]"
                  >
                    <span className="font-medium">{workspace.name}</span>
                    <span className="mt-0.5 block text-[10px] text-[var(--admin-muted)]">
                      {workspace.slug}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  <span className="block text-[var(--admin-text)]">
                    {workspace.ownerName || "—"}
                  </span>
                  <span className="text-[10px]">{workspace.ownerEmail}</span>
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {workspace.memberCount}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {workspace.projectCount}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {workspace.apiKeyCount}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {workspace.errorCount30d}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {workspace.incidentCount30d}
                </td>
                <td className="px-3 py-2.5 capitalize text-[var(--admin-muted)]">
                  {workspace.plan}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {formatBytes(workspace.storageBytes)}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill status={workspace.status} />
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {formatWhen(workspace.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpen(workspace.id)}
                    className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-accent)] hover:bg-[var(--admin-surface)]"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "text-emerald-300 bg-emerald-500/10"
      : status === "suspended"
        ? "text-amber-300 bg-amber-500/10"
        : "text-slate-300 bg-slate-500/10";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone}`}
    >
      {status}
    </span>
  );
}
