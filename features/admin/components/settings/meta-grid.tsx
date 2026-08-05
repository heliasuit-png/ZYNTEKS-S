import type { ReactNode } from "react";

import { HealthDot } from "@/features/admin/components/executive/health-dot";
import type { HealthTone } from "@/services/admin/executive-dashboard.types";

export function MetaGrid({
  items,
}: {
  items: {
    label: string;
    value: ReactNode;
    hint?: string;
    tone?: HealthTone;
  }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/5 bg-[rgba(8,6,18,0.55)] px-3 py-3"
        >
          <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            {item.tone ? <HealthDot tone={item.tone} /> : null}
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium text-[var(--admin-text)]">
            {item.value}
          </dd>
          {item.hint ? (
            <p className="mt-1 text-[11px] text-[var(--admin-muted)]">
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
