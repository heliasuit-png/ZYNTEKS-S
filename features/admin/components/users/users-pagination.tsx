import Link from "next/link";

interface UsersPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  search: string;
}

export function UsersPagination({
  page,
  pageSize,
  total,
  search,
}: UsersPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const params = new URLSearchParams(search);
  const hrefFor = (target: number) => {
    params.set("page", String(target));
    return `?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--admin-muted)]">
      <p>
        Showing{" "}
        <span className="text-[var(--admin-text)]">
          {total === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="text-[var(--admin-text)]">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-lg border border-[var(--admin-border)] px-3 py-1.5 ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:text-[var(--admin-text)]"
          }`}
        >
          Previous
        </Link>
        <span className="text-[var(--admin-text)]">
          {page} / {pages}
        </span>
        <Link
          href={hrefFor(Math.min(pages, page + 1))}
          aria-disabled={page >= pages}
          className={`rounded-lg border border-[var(--admin-border)] px-3 py-1.5 ${
            page >= pages
              ? "pointer-events-none opacity-40"
              : "hover:text-[var(--admin-text)]"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
