"use client";

import { Sparkline, type SparkTone } from "@/components/dashboard/sparkline";
import { useDictionary } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface HealthChartProps {
  values: number[];
  tone?: SparkTone;
  className?: string;
  label?: string;
  emptyLabel?: string;
}

/** Real-data sparkline for health metrics (latency, heartbeat intervals, etc.). */
export function HealthChart({
  values,
  tone = "primary",
  className,
  label,
  emptyLabel,
}: HealthChartProps) {
  const { dict } = useDictionary();
  const resolvedEmpty = emptyLabel ?? dict.dash.health.noSamplesYet;

  if (values.length < 2) {
    return (
      <div
        className={cn(
          "flex h-16 items-center justify-center rounded-xl border border-dashed border-zt-border text-xs text-zt-muted",
          className,
        )}
        role="img"
        aria-label={label ? `${label}: ${resolvedEmpty}` : resolvedEmpty}
      >
        {resolvedEmpty}
      </div>
    );
  }

  return (
    <div className={cn("h-16 w-full", className)}>
      <Sparkline
        points={values}
        tone={tone}
        className="h-full w-full"
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}
