"use client";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { CircularProgress } from "@/components/dashboard/circular-progress";
import { CountUp, FadeIn } from "@/components/dashboard/motion";
import { useDictionary } from "@/components/i18n/locale-provider";
import type { DashboardStats, HealthState } from "@/types/dashboard";

function colorsFor(value: number): { from: string; to: string } {
  if (value >= 90) return { from: "#00ff88", to: "#00e5ff" };
  if (value >= 70) return { from: "#ffb020", to: "#3b82f6" };
  return { from: "#ff3b5c", to: "#ffb020" };
}

function availabilityFor(overall: HealthState): number {
  if (overall === "operational") return 100;
  if (overall === "degraded") return 90;
  return 0;
}

export function SystemHealthGauges({
  stats,
  overall,
}: {
  stats: DashboardStats;
  overall: HealthState;
}) {
  const { dict } = useDictionary();
  const health = dict.dash.home.systemHealth;
  const statsCopy = dict.dash.home.stats;

  const errorFree =
    stats.apiRequestsToday > 0
      ? Math.round(
          (1 -
            Math.min(stats.errorsToday, stats.apiRequestsToday) /
              stats.apiRequestsToday) *
            100,
        )
      : 100;
  const activeRatio =
    stats.totalProjects > 0
      ? Math.round((stats.activeProjects / stats.totalProjects) * 100)
      : 0;
  const availability = availabilityFor(overall);

  const gauges = [
    { label: statsCopy.healthScore, value: stats.healthScore },
    { label: dict.dash.health.availability, value: availability },
    { label: health.errorFree, value: errorFree },
    { label: statsCopy.activeProjects, value: activeRatio },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{health.metricsTitle}</PanelTitle>
        <span className="text-xs text-zt-muted">{health.metricsSubtitle}</span>
      </PanelHeader>
      <PanelContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {gauges.map((gauge, index) => {
            const colors = colorsFor(gauge.value);
            return (
              <FadeIn
                key={gauge.label}
                delay={index * 0.08}
                className="flex flex-col items-center gap-2"
              >
                <CircularProgress
                  value={gauge.value}
                  size={112}
                  strokeWidth={10}
                  from={colors.from}
                  to={colors.to}
                >
                  <span className="text-xl font-semibold tabular-nums text-zt-text">
                    <CountUp value={gauge.value} suffix="%" />
                  </span>
                </CircularProgress>
                <span className="text-center text-xs font-medium text-zt-muted">
                  {gauge.label}
                </span>
              </FadeIn>
            );
          })}
        </div>
      </PanelContent>
    </Panel>
  );
}
