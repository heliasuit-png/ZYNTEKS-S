"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
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
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;

  const rows = [
    {
      label: t.usageProjects,
      used: usage.projects,
      limit: usage.projectLimit,
    },
    {
      label: t.usageApiKeys,
      used: usage.apiKeys,
      limit: null as number | null,
      hint: t.perProjectHint.replace(
        "{count}",
        String(usage.apiKeysPerProject),
      ),
    },
    {
      label: t.usageMembers,
      used: usage.members,
      limit: usage.memberLimit,
    },
    {
      label: t.usageAiMessages,
      used: usage.aiMessages30d,
      limit: usage.aiMessageLimit,
    },
  ];

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>{t.usageDashboard}</PanelTitle>
            <PanelDescription>{t.usageDashboardDesc}</PanelDescription>
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
                    {row.limit !== null
                      ? ` / ${formatLimit(row.limit, t.unlimited)}`
                      : ""}
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
                    aria-label={fillTemplate(t.usageAria, {
                      label: row.label,
                    })}
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
