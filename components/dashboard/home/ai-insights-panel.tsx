"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Gauge,
  Lightbulb,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Panel, PanelContent } from "@/components/dashboard/panel";
import { Button } from "@/components/dashboard/button";
import { CountUp } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import type { DashboardStats } from "@/types/dashboard";

function recommendation(stats: DashboardStats): string {
  if (stats.errorsToday > 0) {
    return `Investigate ${stats.errorsToday} new error${stats.errorsToday === 1 ? "" : "s"} captured today before they reach more users.`;
  }
  if (stats.openIncidents > 0) {
    return `Prioritise resolving ${stats.openIncidents} open incident${stats.openIncidents === 1 ? "" : "s"} to restore full availability.`;
  }
  if (stats.healthScore < 90) {
    return `Health is at ${stats.healthScore}%. Review recent performance metrics to close the gap.`;
  }
  return "No action needed right now — your workspace is running smoothly.";
}

interface Insight {
  icon: LucideIcon;
  label: string;
  text: string;
  className: string;
}

export function AiInsightsPanel({ stats }: { stats: DashboardStats }) {
  const bottlenecks: string[] = [];
  if (stats.errorsToday > 0) {
    bottlenecks.push(`Elevated error volume (${stats.errorsToday} today)`);
  }
  if (stats.openIncidents > 0) {
    bottlenecks.push(`${stats.openIncidents} active incident${stats.openIncidents === 1 ? "" : "s"}`);
  }
  if (stats.healthScore < 90) {
    bottlenecks.push(`Health score below target (${stats.healthScore}%)`);
  }
  if (bottlenecks.length === 0) {
    bottlenecks.push("No bottlenecks detected across monitored services");
  }

  const insights: Insight[] = [
    {
      icon: Zap,
      label: "Performance",
      text: "Cache hot API routes and watch p95 latency on your busiest endpoints.",
      className: "text-zt-accent",
    },
    {
      icon: Lock,
      label: "Security",
      text: "Scope API keys per environment and rotate them on a regular schedule.",
      className: "text-zt-secondary",
    },
  ];

  const healthTone =
    stats.healthScore >= 90
      ? "text-zt-success"
      : stats.healthScore >= 70
        ? "text-zt-warning"
        : "text-zt-danger";

  return (
    <Panel className="relative h-full overflow-hidden">
      <div
        aria-hidden
        className="zt-glow-pulse pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-gradient-to-br from-zt-secondary/45 via-zt-primary/30 to-transparent blur-3xl"
      />
      <div
        aria-hidden
        className="zt-glow-pulse pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-gradient-to-tr from-zt-primary/30 via-zt-secondary/20 to-transparent blur-3xl"
        style={{ animationDelay: "1.4s" }}
      />
      <PanelContent className="relative space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.span
              className="zt-neon flex size-11 items-center justify-center rounded-2xl text-white"
              animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="size-5" aria-hidden />
            </motion.span>
            <div>
              <h3 className="text-base font-semibold text-zt-text">
                AI Health Assistant
              </h3>
              <p className="text-xs text-zt-muted">
                Insights derived from your live telemetry
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                healthTone,
              )}
            >
              <CountUp value={stats.healthScore} suffix="%" />
            </span>
            <span className="text-[11px] uppercase tracking-wider text-zt-muted">
              Health score
            </span>
          </div>
        </div>

        {/* Latest recommendation */}
        <div className="rounded-xl border border-zt-primary/30 bg-gradient-to-r from-zt-primary/15 to-zt-secondary/10 p-4 shadow-[0_0_30px_-12px_var(--color-zt-primary)]">
          <span className="flex items-center gap-1.5 text-xs font-medium text-zt-primary">
            <Lightbulb className="size-3.5" aria-hidden />
            Latest recommendation
          </span>
          <p className="mt-1.5 text-sm text-zt-text/90">
            {recommendation(stats)}
          </p>
        </div>

        {/* Potential bottlenecks */}
        <div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-zt-muted">
            <Gauge className="size-3.5" aria-hidden />
            Potential bottlenecks
          </span>
          <ul className="mt-2 space-y-1.5">
            {bottlenecks.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-zt-text/80"
              >
                <TrendingUp
                  className="mt-0.5 size-3.5 shrink-0 text-zt-muted"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Advice grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.label}
                className="rounded-xl border border-zt-border bg-white/[0.02] p-3"
              >
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    insight.className,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {insight.label}
                </span>
                <p className="mt-1 text-xs text-zt-muted">{insight.text}</p>
              </div>
            );
          })}
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={DASHBOARD_ROUTES.aiAssistant}>
            <Sparkles aria-hidden />
            Analyze Project
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PanelContent>
    </Panel>
  );
}
