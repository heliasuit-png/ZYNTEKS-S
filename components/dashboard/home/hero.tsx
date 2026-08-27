"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AiInfinity } from "@/components/dashboard/home/ai-infinity";
import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import type { DashboardStats, HealthState } from "@/types/dashboard";

interface HeroProps {
  userName: string;
  workspaceLabel: string;
  stats: DashboardStats;
  overall: HealthState;
}

interface SummaryLine {
  icon: LucideIcon;
  text: string;
  className: string;
}

export function DashboardHero({
  userName,
  workspaceLabel,
  stats,
  overall,
}: HeroProps) {
  const { dict } = useDictionary();
  const g = dict.dash.home.greetings;
  const s = dict.dash.home.summary;
  const [greeting, setGreeting] = useState(g.welcomeBack);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(g.morning);
    else if (hour < 18) setGreeting(g.afternoon);
    else setGreeting(g.evening);
  }, [g.afternoon, g.evening, g.morning]);

  const healthy =
    overall === "operational" &&
    stats.errorsToday === 0 &&
    stats.totalProjects > 0;

  const summary: SummaryLine[] =
    stats.totalProjects === 0
      ? [
          {
            icon: CheckCircle2,
            text: s.setupTryAi,
            className: "text-zt-primary",
          },
          {
            icon: ShieldCheck,
            text: s.noIncidentsYet,
            className: "text-zt-muted",
          },
          {
            icon: FolderKanban,
            text: s.zeroProjects,
            className: "text-zt-muted",
          },
        ]
      : [
          healthy
            ? {
                icon: CheckCircle2,
                text: s.healthyToday,
                className: "text-zt-success",
              }
            : {
                icon: AlertTriangle,
                text:
                  overall === "down" ? s.serviceDisruption : s.needsCloserLook,
                className: "text-zt-warning",
              },
          {
            icon: overall === "operational" ? ShieldCheck : AlertTriangle,
            text:
              stats.openIncidents === 0
                ? s.noIncidentsDetected
                : fillTemplate(
                    stats.openIncidents === 1
                      ? s.incidentsOpen
                      : s.incidentsOpenPlural,
                    { count: stats.openIncidents },
                  ),
            className:
              stats.openIncidents === 0 ? "text-zt-success" : "text-zt-warning",
          },
          {
            icon: FolderKanban,
            text: fillTemplate(
              stats.activeProjects === 1
                ? s.projectsMonitored
                : s.projectsMonitoredPlural,
              { count: stats.activeProjects },
            ),
            className: "text-zt-muted",
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="zt-card relative overflow-hidden rounded-2xl p-6 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/2 size-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-zt-primary/20 to-transparent blur-3xl"
      />

      <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="min-w-0 space-y-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-zt-muted">
              {workspaceLabel}
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                {greeting}
                {userName ? `, ${userName}` : ""}
              </span>
            </h1>
          </div>

          <ul className="space-y-2">
            {summary.map((line, index) => {
              const Icon = line.icon;
              return (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
                  className="flex items-center gap-2 text-sm text-zt-text/90"
                >
                  <Icon
                    className={cn("size-4 shrink-0", line.className)}
                    aria-hidden
                  />
                  {line.text}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <div className="shrink-0 self-center md:self-auto">
          <AiInfinity size={220} />
        </div>
      </div>
    </motion.div>
  );
}
