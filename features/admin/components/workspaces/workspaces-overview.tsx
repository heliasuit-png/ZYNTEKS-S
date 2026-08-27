"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { WorkspacesOverviewStats } from "@/services/admin/workspaces.types";
import { formatNumber } from "@/features/admin/components/executive/format";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function WorkspacesOverview({
  stats,
}: {
  stats: WorkspacesOverviewStats;
}) {
  const { dict } = useDictionary();
  const t = dict.admin.workspaces.overview;

  const cards: {
    key: keyof WorkspacesOverviewStats;
    label: string;
    format?: (value: number) => string;
  }[] = [
    { key: "totalWorkspaces", label: t.totalWorkspaces },
    { key: "newToday", label: t.newToday },
    { key: "activeWorkspaces", label: t.activeWorkspaces },
    { key: "enterprisePlans", label: t.enterprisePlans },
    { key: "averageMembers", label: t.averageMembers },
    { key: "averageProjects", label: t.averageProjects },
    { key: "averageApiKeys", label: t.averageApiKeys },
    {
      key: "aiUsageTokens30d",
      label: t.aiUsage30d,
      format: formatNumber,
    },
    {
      key: "storageBytes",
      label: t.storageUsage,
      format: formatBytes,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-9">
      {cards.map((card) => (
        <article key={card.key} className="admin-glass rounded-2xl px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
            {card.format
              ? card.format(stats[card.key])
              : typeof stats[card.key] === "number" &&
                  !Number.isInteger(stats[card.key])
                ? stats[card.key].toFixed(1)
                : formatNumber(stats[card.key])}
          </p>
        </article>
      ))}
    </div>
  );
}
