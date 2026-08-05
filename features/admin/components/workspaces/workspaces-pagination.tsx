import Link from "next/link";

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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const params = new URLSearchParams(search);

  function hrefFor(nextPage: number) {
    params.set("page", String(nextPage));
    return `${ADMIN_ROUTES.workspaces}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--admin-muted)]">
      <p>
        Showing {(total === 0 ? 0 : (page - 1) * pageSize + 1).toLocaleString()}–
        {Math.min(page * pageSize, total).toLocaleString()} of{" "}
        {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 hover:text-[var(--admin-text)]"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-[var(--admin-border)]/50 px-3 py-1.5 opacity-40">
            Previous
          </span>
        )}
        <span>
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 hover:text-[var(--admin-text)]"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-[var(--admin-border)]/50 px-3 py-1.5 opacity-40">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
