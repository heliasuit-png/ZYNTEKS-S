import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";

function alignClass(align: Align = "left"): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: Align;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  empty?: ReactNode;
}

/** Generic, reusable table with a built-in empty state. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  empty,
}: DataTableProps<T>) {
  return (
    <div className="zt-card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="zt-glass-strong border-b border-zt-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-zt-muted",
                    alignClass(column.align),
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  {empty ?? (
                    <p className="text-center text-sm text-zt-muted">
                      No records to display.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-zt-border/70 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 text-zt-text",
                        alignClass(column.align),
                        column.className,
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
