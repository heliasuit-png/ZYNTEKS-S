"use client";

import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { DashboardRange } from "@/services/admin/executive-dashboard.types";

const RANGE_IDS: DashboardRange[] = ["24h", "7d", "30d"];

export function RangeTabs({ range }: { range: DashboardRange }) {
  const { dict } = useDictionary();
  const t = dict.admin.executive.range;

  const labels: Record<DashboardRange, string> = {
    "24h": t.last24h,
    "7d": t.last7d,
    "30d": t.last30d,
  };

  return (
    <div
      className="inline-flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1"
      role="tablist"
      aria-label={t.ariaLabel}
    >
      {RANGE_IDS.map((id) => {
        const active = id === range;
        return (
          <Link
            key={id}
            href={`${ADMIN_ROUTES.dashboard}?range=${id}`}
            role="tab"
            aria-selected={active}
            className={[
              "admin-accent-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
            ].join(" ")}
          >
            {labels[id]}
          </Link>
        );
      })}
    </div>
  );
}
