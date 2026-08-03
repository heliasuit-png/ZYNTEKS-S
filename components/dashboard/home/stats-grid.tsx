"use client";

import { Activity, Bug, FolderKanban, HeartPulse, Rocket, Siren } from "lucide-react";

import { FadeIn } from "@/components/dashboard/motion";
import { StatCard } from "@/components/dashboard/stat-card";
import type { StatTone } from "@/components/dashboard/stat-card";
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
  const items: StatItem[] = [
    {
      label: "Total Projects",
      count: stats.totalProjects,
      icon: FolderKanban,
      tone: "secondary",
      status: "All workspaces",
      explanation: "Every project connected to this workspace.",
    },
    {
      label: "Active Projects",
      count: stats.activeProjects,
      icon: Rocket,
      tone: "success",
      status: "Live now",
      explanation: "Projects currently sending heartbeats or traffic.",
    },
    {
      label: "SDK Events Today",
      count: stats.apiRequestsToday,
      icon: Activity,
      tone: "accent",
      status: "Last 24h",
      explanation:
        "Heartbeats, performance samples, and errors ingested in the last 24 hours.",
    },
    {
      label: "Errors Today",
      count: stats.errorsToday,
      icon: Bug,
      tone: stats.errorsToday > 0 ? "danger" : "muted",
      status: stats.errorsToday > 0 ? "Action needed" : "All clear",
      explanation: "Distinct errors captured across your projects today.",
    },
    {
      label: "Health Score",
      count: stats.healthScore,
      suffix: "%",
      icon: HeartPulse,
      tone: healthTone(stats.healthScore),
      status:
        stats.healthScore >= 90
          ? "Excellent"
          : stats.healthScore >= 70
            ? "Fair"
            : "Degraded",
      explanation:
        "Composite score from uptime, errors, incidents and response time.",
    },
    {
      label: "Open Incidents",
      count: stats.openIncidents,
      icon: Siren,
      tone: stats.openIncidents > 0 ? "warning" : "muted",
      status: stats.openIncidents > 0 ? "Investigating" : "None open",
      explanation: "Incidents that are not yet resolved.",
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
