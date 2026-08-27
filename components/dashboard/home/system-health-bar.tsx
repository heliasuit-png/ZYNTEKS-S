"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Database,
  Mail,
  Radar,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { useDictionary } from "@/components/i18n/locale-provider";
import type { HealthState } from "@/types/dashboard";

type Status = "operational" | "degraded" | "down";

const statusStyles: Record<
  Status,
  { dot: string; text: string; bar: string; glow: string }
> = {
  operational: {
    dot: "bg-zt-success",
    text: "text-zt-success",
    bar: "from-zt-success/60 to-zt-success/20",
    glow: "shadow-[0_0_12px_rgba(34,197,94,0.6)]",
  },
  degraded: {
    dot: "bg-zt-warning",
    text: "text-zt-warning",
    bar: "from-zt-warning/60 to-zt-warning/20",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.6)]",
  },
  down: {
    dot: "bg-zt-danger",
    text: "text-zt-danger",
    bar: "from-zt-danger/60 to-zt-danger/20",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.7)]",
  },
};

function worse(a: Status, b: Status): Status {
  const rank: Record<Status, number> = { operational: 0, degraded: 1, down: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function SystemHealthBar({
  overall,
  openIncidents,
  errorsToday,
}: {
  overall: HealthState;
  openIncidents: number;
  errorsToday: number;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.home.systemHealth;

  const statusLabels: Record<Status, string> = {
    operational: t.operational,
    degraded: t.degraded,
    down: t.down,
  };

  const base: Status = overall;
  const incidentState: Status = openIncidents > 0 ? "degraded" : "operational";
  const errorState: Status = errorsToday > 0 ? "degraded" : "operational";

  const sections: Array<{ label: string; icon: LucideIcon; state: Status }> = [
    { label: t.api, icon: Server, state: worse(base, errorState) },
    { label: t.database, icon: Database, state: base },
    { label: t.heartbeat, icon: Activity, state: worse(base, incidentState) },
    { label: t.ai, icon: Bot, state: base },
    { label: t.email, icon: Mail, state: base },
    { label: t.monitoring, icon: Radar, state: worse(base, incidentState) },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>
          <span className="flex items-center gap-2">
            <Radar className="size-4 text-zt-primary" aria-hidden />
            {t.title}
          </span>
        </PanelTitle>
        <span className="flex items-center gap-1.5 text-xs text-zt-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-zt-success/70" />
            <span className="relative size-2 rounded-full bg-zt-success" />
          </span>
          {t.live}
        </span>
      </PanelHeader>
      <PanelContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sections.map((section, index) => {
            const meta = statusStyles[section.state];
            const Icon = section.icon;
            return (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="rounded-xl border border-zt-border bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-zt-muted">
                    <Icon className="size-3.5" aria-hidden />
                    {section.label}
                  </span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      meta.dot,
                      meta.glow,
                    )}
                    aria-hidden
                  />
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      meta.bar,
                    )}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      delay: 0.2 + index * 0.06,
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                  />
                </div>
                <p className={cn("mt-2 text-[11px] font-medium", meta.text)}>
                  {statusLabels[section.state]}
                </p>
              </motion.div>
            );
          })}
        </div>
      </PanelContent>
    </Panel>
  );
}
