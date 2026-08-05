import type { UsersOverviewStats } from "@/services/admin/users.types";

const CARDS: { key: keyof UsersOverviewStats; label: string }[] = [
  { key: "totalUsers", label: "Total Users" },
  { key: "newToday", label: "New Today" },
  { key: "activeToday", label: "Active Today" },
  { key: "verifiedUsers", label: "Verified Users" },
  { key: "suspendedUsers", label: "Suspended Users" },
  { key: "admins", label: "Admins" },
  { key: "workspaceOwners", label: "Workspace Owners" },
];

export function UsersOverview({ stats }: { stats: UsersOverviewStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      {CARDS.map((card) => (
        <article
          key={card.key}
          className="admin-glass rounded-2xl px-3 py-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
            {stats[card.key].toLocaleString()}
          </p>
        </article>
      ))}
    </div>
  );
}
