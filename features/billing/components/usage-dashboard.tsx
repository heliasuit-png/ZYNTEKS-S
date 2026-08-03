import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { formatLimit, usagePercent } from "@/utils/billing";
import type { BillingUsageSnapshot } from "@/services/billing/types";

export function UsageDashboard({ usage }: { usage: BillingUsageSnapshot }) {
  const rows = [
    {
      label: "Projects",
      used: usage.projects,
      limit: usage.projectLimit,
    },
    {
      label: "API keys (workspace)",
      used: usage.apiKeys,
      limit: null as number | null,
      hint: `≤ ${usage.apiKeysPerProject} per project`,
    },
    {
      label: "Members",
      used: usage.members,
      limit: usage.memberLimit,
    },
    {
      label: "AI messages (30d)",
      used: usage.aiMessages30d,
      limit: usage.aiMessageLimit,
    },
  ];

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Usage dashboard</PanelTitle>
            <PanelDescription>
              Live workspace consumption against your plan limits.
            </PanelDescription>
          </div>
        </PanelHeader>
        <PanelContent className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => {
            const pct = usagePercent(row.used, row.limit);
            return (
              <div
                key={row.label}
                className="rounded-xl border border-zt-border bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-zt-muted">{row.label}</p>
                  <p className="text-sm font-semibold text-zt-text">
                    {row.used.toLocaleString()}
                    {row.limit !== null ? ` / ${formatLimit(row.limit)}` : ""}
                  </p>
                </div>
                {row.hint ? (
                  <p className="mt-1 text-xs text-zt-muted">{row.hint}</p>
                ) : null}
                {row.limit !== null ? (
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-zt-surface-2"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.label} usage`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 90
                          ? "bg-zt-danger"
                          : pct >= 70
                            ? "bg-zt-warning"
                            : "bg-zt-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
