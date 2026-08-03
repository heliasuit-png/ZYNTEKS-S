"use client";

import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CountUp } from "@/components/dashboard/motion";
import { Tooltip } from "@/components/dashboard/tooltip";
import { Sparkline } from "@/components/dashboard/sparkline";
import type { SparkTone } from "@/components/dashboard/sparkline";

export type StatTone =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const toneMeta: Record<
  StatTone,
  { icon: string; iconShadow: string; glow: string; dot: string; spark: SparkTone }
> = {
  primary: {
    icon: "bg-gradient-to-br from-zt-primary/30 to-zt-primary/5 text-zt-primary",
    iconShadow: "0 0 22px -6px var(--color-zt-primary)",
    glow: "before:bg-zt-primary/25",
    dot: "bg-zt-primary shadow-[0_0_8px_var(--color-zt-primary)]",
    spark: "primary",
  },
  secondary: {
    icon: "bg-gradient-to-br from-zt-secondary/30 to-zt-secondary/5 text-zt-secondary",
    iconShadow: "0 0 22px -6px var(--color-zt-secondary)",
    glow: "before:bg-zt-secondary/25",
    dot: "bg-zt-secondary shadow-[0_0_8px_var(--color-zt-secondary)]",
    spark: "secondary",
  },
  accent: {
    icon: "bg-gradient-to-br from-zt-accent/30 to-zt-accent/5 text-zt-accent",
    iconShadow: "0 0 22px -6px var(--color-zt-accent)",
    glow: "before:bg-zt-accent/25",
    dot: "bg-zt-accent shadow-[0_0_8px_var(--color-zt-accent)]",
    spark: "accent",
  },
  success: {
    icon: "bg-gradient-to-br from-zt-success/30 to-zt-success/5 text-zt-success",
    iconShadow: "0 0 22px -6px var(--color-zt-success)",
    glow: "before:bg-zt-success/25",
    dot: "bg-zt-success shadow-[0_0_8px_var(--color-zt-success)]",
    spark: "success",
  },
  warning: {
    icon: "bg-gradient-to-br from-zt-warning/30 to-zt-warning/5 text-zt-warning",
    iconShadow: "0 0 22px -6px var(--color-zt-warning)",
    glow: "before:bg-zt-warning/25",
    dot: "bg-zt-warning shadow-[0_0_8px_var(--color-zt-warning)]",
    spark: "warning",
  },
  danger: {
    icon: "bg-gradient-to-br from-zt-danger/30 to-zt-danger/5 text-zt-danger",
    iconShadow: "0 0 22px -6px var(--color-zt-danger)",
    glow: "before:bg-zt-danger/30",
    dot: "bg-zt-danger shadow-[0_0_8px_var(--color-zt-danger)]",
    spark: "danger",
  },
  muted: {
    icon: "bg-white/[0.05] text-zt-muted",
    iconShadow: "none",
    glow: "before:bg-white/5",
    dot: "bg-zt-muted",
    spark: "muted",
  },
};

interface StatCardProps {
  label: string;
  /** Raw numeric value; animated with a count-up. */
  count: number;
  /** Appended after the number (e.g. "%"). */
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  /** Optional short status text shown next to the indicator dot. */
  status?: string;
  /** Optional explanation surfaced via an info tooltip. */
  explanation?: string;
}

export function StatCard({
  label,
  count,
  suffix,
  decimals = 0,
  icon: Icon,
  tone = "primary",
  hint,
  status,
  explanation,
}: StatCardProps) {
  const meta = toneMeta[tone];

  return (
    <div
      className={cn(
        "zt-card zt-gradient-border zt-hover-lift group relative overflow-hidden rounded-2xl p-5",
        "before:pointer-events-none before:absolute before:-right-10 before:-top-10 before:size-32 before:rounded-full before:opacity-50 before:blur-3xl before:transition-opacity before:duration-500 before:content-[''] group-hover:before:opacity-90",
        meta.glow,
      )}
    >
      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-zt-muted">
          {label}
          {explanation ? (
            <Tooltip content={explanation}>
              <button
                type="button"
                aria-label={`About ${label}`}
                className="rounded-full text-zt-muted/60 transition-colors hover:text-zt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50"
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </Tooltip>
          ) : null}
        </span>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl border border-white/5 transition-transform duration-300 group-hover:scale-110",
            meta.icon,
          )}
          style={{ boxShadow: meta.iconShadow }}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <p className="relative mt-4 text-3xl font-semibold tracking-tight text-zt-text tabular-nums">
        <CountUp value={count} decimals={decimals} suffix={suffix ?? ""} />
      </p>

      <div className="relative mt-1 flex items-center justify-between gap-2">
        {status ? (
          <span className="flex items-center gap-1.5 text-xs text-zt-muted">
            <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
            {status}
          </span>
        ) : hint ? (
          <span className="text-xs text-zt-muted">{hint}</span>
        ) : (
          <span />
        )}
        <Sparkline
          tone={meta.spark}
          className="h-8 w-20 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>
    </div>
  );
}
