"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { AdminUserListItem } from "@/services/admin/users.types";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

interface UsersTableProps {
  items: AdminUserListItem[];
  onOpen: (userId: string) => void;
}

export function UsersTable({ items, onOpen }: UsersTableProps) {
  const { dict } = useDictionary();
  const t = dict.admin.users.table;
  const empty = dict.admin.users.empty;
  const filters = dict.admin.users.filters;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "created_at";
  const direction = searchParams.get("direction") ?? "desc";

  const columns: { key: string; label: string; sort?: string }[] = [
    { key: "avatar", label: t.avatar },
    { key: "full_name", label: t.fullName, sort: "full_name" },
    { key: "email", label: t.email, sort: "email" },
    { key: "role", label: t.role, sort: "role" },
    { key: "workspace", label: t.workspace },
    { key: "projects", label: t.projects, sort: "projects" },
    { key: "plan", label: t.plan, sort: "plan" },
    { key: "status", label: t.status, sort: "status" },
    { key: "auth", label: t.auth },
    { key: "last_login", label: t.lastLogin, sort: "last_login" },
    { key: "created_at", label: t.created, sort: "created_at" },
    { key: "actions", label: t.actions },
  ];

  function sortHref(field: string) {
    const params = new URLSearchParams(searchParams.toString());
    const nextDir = sort === field && direction === "asc" ? "desc" : "asc";
    params.set("sort", field);
    params.set("direction", nextDir);
    return `${pathname}?${params.toString()}`;
  }

  if (items.length === 0) {
    return <AdminEmptyState title={empty.title} description={empty.description} />;
  }

  return (
    <div className="admin-glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-wider text-[var(--admin-muted)]">
            <tr>
              {columns.map((column) => (
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
            {items.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--admin-border)]/70 transition-colors hover:bg-[var(--admin-surface)]"
              >
                <td className="px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--admin-accent-soft)] text-xs font-semibold text-[var(--admin-accent)]">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user.fullName?.[0] ?? user.email[0] ?? "?").toUpperCase()
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {user.fullName || "—"}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {user.email}
                  {user.verified === true ? (
                    <span className="ml-2 text-[10px] text-emerald-400">
                      {t.verified}
                    </span>
                  ) : user.verified === false ? (
                    <span className="ml-2 text-[10px] text-amber-300">
                      {t.unverified}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-text)]">
                  {user.displayRole}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {user.workspaceName ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {user.projectCount}
                </td>
                <td className="px-3 py-2.5 capitalize text-[var(--admin-muted)]">
                  {user.plan}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill
                    status={user.status}
                    suspendedLabel={t.suspended}
                    activeLabel={filters.active}
                    inactiveLabel={filters.inactive}
                  />
                </td>
                <td className="px-3 py-2.5 text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
                  {(user.authProviders ?? ["email"]).join(" · ")}
                  {user.mfaEnabled ? (
                    <span className="ml-1 text-emerald-400">{t.mfa}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {formatWhen(user.lastLoginAt)}
                </td>
                <td className="px-3 py-2.5 text-[var(--admin-muted)]">
                  {formatWhen(user.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpen(user.id)}
                    className="admin-accent-ring rounded-lg border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-accent)] hover:border-[var(--admin-border-strong)]"
                  >
                    {t.open}
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

function StatusPill({
  status,
  suspendedLabel,
  activeLabel,
  inactiveLabel,
}: {
  status: string;
  suspendedLabel: string;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const tone =
    status === "active"
      ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"
      : status === "banned"
        ? "text-rose-300 border-rose-400/30 bg-rose-400/10"
        : "text-amber-300 border-amber-400/30 bg-amber-400/10";
  const label =
    status === "banned"
      ? suspendedLabel
      : status === "active"
        ? activeLabel
        : status === "inactive"
          ? inactiveLabel
          : status;
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}
