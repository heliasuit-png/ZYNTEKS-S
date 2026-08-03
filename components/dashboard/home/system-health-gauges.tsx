"use client";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { CircularProgress } from "@/components/dashboard/circular-progress";
import { CountUp, FadeIn } from "@/components/dashboard/motion";
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
    { label: "Health Score", value: stats.healthScore },
    { label: "Availability", value: availability },
    { label: "Error-free", value: errorFree },
    { label: "Active Projects", value: activeRatio },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>System Metrics</PanelTitle>
        <span className="text-xs text-zt-muted">Derived from live telemetry</span>
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
