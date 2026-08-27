"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { UsersOverviewStats } from "@/services/admin/users.types";

const CARD_KEYS = [
  "totalUsers",
  "newToday",
  "activeToday",
  "verifiedUsers",
  "suspendedUsers",
  "admins",
  "workspaceOwners",
] as const;

export function UsersOverview({ stats }: { stats: UsersOverviewStats }) {
  const { dict } = useDictionary();
  const t = dict.admin.users.overview;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {CARD_KEYS.map((key) => (
        <article key={key} className="admin-glass rounded-2xl px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            {t[key]}
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
            {stats[key].toLocaleString()}
          </p>
        </article>
      ))}
    </div>
  );
}
