"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TerminalSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useDictionary } from "@/components/i18n/locale-provider";
import { formatRelativeTime } from "@/utils/format";
import type { ActivityItem, ActivityType } from "@/types/dashboard";

const typeMeta: Record<ActivityType, { tag: string; className: string }> = {
  project: { tag: "project", className: "text-zt-primary" },
  api_key: { tag: "api_key", className: "text-zt-accent" },
  error: { tag: "error", className: "text-zt-danger" },
  incident: { tag: "incident", className: "text-zt-warning" },
  billing: { tag: "billing", className: "text-zt-secondary" },
  member: { tag: "member", className: "text-zt-muted" },
};

/** UTC clock — identical on server and client (avoids locale/TZ hydration #418). */
function timeLabelUtc(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toISOString().slice(11, 19);
}

export function LiveActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.home.liveActivity;
  // Relative labels use "now" — only compute after mount to match client clock.
  const [relativeReady, setRelativeReady] = useState(false);
  useEffect(() => {
    setRelativeReady(true);
  }, []);

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>
          <span className="flex items-center gap-2">
            <TerminalSquare className="size-4 text-zt-primary" aria-hidden />
            {t.title}
          </span>
        </PanelTitle>
        <span className="flex items-center gap-1.5 text-xs text-zt-muted">
          <span className="size-2 rounded-full bg-zt-danger/80" />
          <span className="size-2 rounded-full bg-zt-warning/80" />
          <span className="size-2 rounded-full bg-zt-success/80" />
        </span>
      </PanelHeader>
      <PanelContent>
        {activity.length === 0 ? (
          <EmptyState
            icon={TerminalSquare}
            title={t.waiting}
            description={t.waitingDesc}
          />
        ) : (
          <div className="max-h-[22rem] overflow-y-auto rounded-xl border border-zt-border bg-black/30 p-4 font-mono text-[13px] leading-relaxed">
            {activity.map((item, index) => {
              const meta = typeMeta[item.type] ?? typeMeta.member;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.28 }}
                  className="group flex flex-wrap items-baseline gap-x-2 py-1"
                >
                  <span className="text-zt-muted/70" title="UTC">
                    {timeLabelUtc(item.createdAt)}
                  </span>
                  <span className="text-zt-primary/80">▸</span>
                  <span className={cn("font-semibold", meta.className)}>
                    {meta.tag}
                  </span>
                  <span className="text-zt-text/90">{item.title}</span>
                  <span className="w-full pl-[4.5rem] text-xs text-zt-muted/70 sm:w-auto sm:pl-0">
                    — {item.description}
                    {relativeReady ? (
                      <> · {formatRelativeTime(item.createdAt, undefined, locale)}</>
                    ) : null}
                  </span>
                </motion.div>
              );
            })}
            <div className="flex items-center gap-2 pt-1 text-zt-muted/60">
              <span className="text-zt-success">$</span>
              <span className="inline-block h-4 w-1.5 animate-pulse bg-zt-success/70" />
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}
