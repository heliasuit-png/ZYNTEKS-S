import Link from "next/link";

import { ADMIN_ROUTES } from "@/lib/constants";
import type { DashboardRange } from "@/services/admin/executive-dashboard.types";

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: "24h", label: "Last 24h" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function RangeTabs({ range }: { range: DashboardRange }) {
  return (
    <div
      className="inline-flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1"
      role="tablist"
      aria-label="Dashboard range"
    >
      {RANGES.map((item) => {
        const active = item.id === range;
        return (
          <Link
            key={item.id}
            href={`${ADMIN_ROUTES.dashboard}?range=${item.id}`}
            role="tab"
            aria-selected={active}
            className={[
              "admin-accent-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
