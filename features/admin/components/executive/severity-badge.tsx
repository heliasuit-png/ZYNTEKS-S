"use client";

import type { IncidentSeverity } from "@/types/database";
import { useDictionary } from "@/components/i18n/locale-provider";

const CLASS: Record<IncidentSeverity, string> = {
  low: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  critical: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const { dict } = useDictionary();
  const labels: Record<IncidentSeverity, string> = {
    low: dict.admin.common.severityLow,
    medium: dict.admin.common.severityMedium,
    high: dict.admin.common.severityHigh,
    critical: dict.admin.common.severityCritical,
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CLASS[severity]}`}
    >
      {labels[severity]}
    </span>
  );
}
