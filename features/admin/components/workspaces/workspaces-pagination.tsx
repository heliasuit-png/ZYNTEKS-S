"use client";

import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { ADMIN_ROUTES } from "@/lib/constants";

interface WorkspacesPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  search: string;
}

export function WorkspacesPagination({
  page,
  pageSize,
  total,
  search,
}: WorkspacesPaginationProps) {
  const { dict } = useDictionary();
  const common = dict.admin.common;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const params = new URLSearchParams(search);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefFor(nextPage: number) {
    params.set("page", String(nextPage));
    return `${ADMIN_ROUTES.workspaces}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--admin-muted)]">
      <p>{fillTemplate(common.showingOf, { from, to, total })}</p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 hover:text-[var(--admin-text)]"
          >
            {common.previous}
          </Link>
        ) : (
          <span className="rounded-lg border border-[var(--admin-border)]/50 px-3 py-1.5 opacity-40">
            {common.previous}
          </span>
        )}
        <span>{fillTemplate(common.pageOf, { page, pages: totalPages })}</span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 hover:text-[var(--admin-text)]"
          >
            {common.next}
          </Link>
        ) : (
          <span className="rounded-lg border border-[var(--admin-border)]/50 px-3 py-1.5 opacity-40">
            {common.next}
          </span>
        )}
      </div>
    </div>
  );
}
