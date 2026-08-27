"use client";

import { Activity, Bug, FolderKanban, HeartPulse, Rocket, Siren } from "lucide-react";

import { FadeIn } from "@/components/dashboard/motion";
import { StatCard } from "@/components/dashboard/stat-card";
import type { StatTone } from "@/components/dashboard/stat-card";
import { useDictionary } from "@/components/i18n/locale-provider";
import type { DashboardStats } from "@/types/dashboard";

interface StatItem {
  label: string;
  count: number;
  suffix?: string;
  icon: typeof Activity;
  tone: StatTone;
  status?: string;
  explanation?: string;
}

function healthTone(score: number): StatTone {
  if (score >= 90) return "success";
  if (score >= 70) return "warning";
  return "danger";
}

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const { dict } = useDictionary();
  const t = dict.dash.home.stats;

  const items: StatItem[] = [
    {
      label: t.totalProjects,
      count: stats.totalProjects,
      icon: FolderKanban,
      tone: "secondary",
      status: t.allWorkspaces,
      explanation: t.totalProjectsHint,
    },
    {
      label: t.activeProjects,
      count: stats.activeProjects,
      icon: Rocket,
      tone: "success",
      status: t.liveNow,
      explanation: t.activeProjectsHint,
    },
    {
      label: t.sdkEventsToday,
      count: stats.apiRequestsToday,
      icon: Activity,
      tone: "accent",
      status: t.last24h,
      explanation: t.sdkEventsHint,
    },
    {
      label: t.errorsToday,
      count: stats.errorsToday,
      icon: Bug,
      tone: stats.errorsToday > 0 ? "danger" : "muted",
      status: stats.errorsToday > 0 ? t.actionNeeded : t.allClear,
      explanation: t.errorsTodayHint,
    },
    {
      label: t.healthScore,
      count: stats.healthScore,
      suffix: "%",
      icon: HeartPulse,
      tone: healthTone(stats.healthScore),
      status:
        stats.healthScore >= 90
          ? t.excellent
          : stats.healthScore >= 70
            ? t.fair
            : t.degraded,
      explanation: t.healthScoreHint,
    },
    {
      label: t.openIncidents,
      count: stats.openIncidents,
      icon: Siren,
      tone: stats.openIncidents > 0 ? "warning" : "muted",
      status: stats.openIncidents > 0 ? t.investigating : t.noneOpen,
      explanation: t.openIncidentsHint,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <FadeIn key={item.label} delay={index * 0.05} y={12}>
          <StatCard
            label={item.label}
            count={item.count}
            suffix={item.suffix}
            icon={item.icon}
            tone={item.tone}
            status={item.status}
            explanation={item.explanation}
          />
        </FadeIn>
      ))}
    </div>
  );
}
