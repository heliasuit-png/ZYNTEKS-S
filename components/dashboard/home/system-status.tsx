"use client";

import { cn } from "@/lib/utils";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { formatDate } from "@/utils/format";
import type { HealthState, SystemStatus } from "@/types/dashboard";

const stateStyles: Record<HealthState, { dot: string; text: string }> = {
  operational: {
    dot: "bg-zt-success",
    text: "text-zt-success",
  },
  degraded: {
    dot: "bg-zt-warning",
    text: "text-zt-warning",
  },
  down: { dot: "bg-zt-danger", text: "text-zt-danger" },
};

export function SystemStatusPanel({ status }: { status: SystemStatus }) {
  const { dict } = useDictionary();
  const t = dict.dash.home.systemHealth;
  const labels: Record<HealthState, string> = {
    operational: t.operational,
    degraded: t.degraded,
    down: t.down,
  };
  const meta = stateStyles[status.overall];

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>{t.statusTitle}</PanelTitle>
        <span
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            meta.text,
          )}
        >
          <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
          {status.overall === "operational"
            ? t.allOperational
            : labels[status.overall]}
        </span>
      </PanelHeader>
      <PanelContent>
        {status.components.length === 0 ? (
          <p className="text-sm text-zt-muted">{t.allNormal}</p>
        ) : (
          <ul className="space-y-2">
            {status.components.map((component) => (
              <li
                key={component.id}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-zt-text">{component.name}</span>
                <span
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    stateStyles[component.state].text,
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      stateStyles[component.state].dot,
                    )}
                    aria-hidden
                  />
                  {labels[component.state]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-zt-muted">
          {fillTemplate(t.updatedAt, { date: formatDate(status.updatedAt) })}
        </p>
      </PanelContent>
    </Panel>
  );
}
