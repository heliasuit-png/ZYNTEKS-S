import type { Paginated, PaginationParams } from "@/types/dashboard";

export const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/** Clamps arbitrary input into a safe {@link PaginationParams}. */
export function normalizePagination(
  params?: Partial<PaginationParams>,
): PaginationParams {
  const rawPage = params?.page;
  const rawPageSize = params?.pageSize;

  const page = Number.isFinite(rawPage)
    ? Math.max(1, Math.trunc(rawPage as number))
    : 1;
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(rawPageSize as number)))
    : DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

export function createPage<T>(
  items: T[],
  total: number,
  params: PaginationParams,
): Paginated<T> {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

/** An empty, well-formed page. Used until a data source is connected. */
export function emptyPage<T>(params?: Partial<PaginationParams>): Paginated<T> {
  return createPage<T>([], 0, normalizePagination(params));
}
