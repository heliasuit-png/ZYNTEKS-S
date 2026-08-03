import { cn } from "@/lib/utils";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { formatDate } from "@/utils/format";
import type { HealthState, SystemStatus } from "@/types/dashboard";

const stateMeta: Record<
  HealthState,
  { label: string; dot: string; text: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-zt-success",
    text: "text-zt-success",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-zt-warning",
    text: "text-zt-warning",
  },
  down: { label: "Down", dot: "bg-zt-danger", text: "text-zt-danger" },
};

export function SystemStatusPanel({ status }: { status: SystemStatus }) {
  const meta = stateMeta[status.overall];

  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>System Status</PanelTitle>
        <span
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            meta.text,
          )}
        >
          <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
          {status.overall === "operational"
            ? "All systems operational"
            : meta.label}
        </span>
      </PanelHeader>
      <PanelContent>
        {status.components.length === 0 ? (
          <p className="text-sm text-zt-muted">
            All monitored systems are operating normally.
          </p>
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
                    stateMeta[component.state].text,
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      stateMeta[component.state].dot,
                    )}
                    aria-hidden
                  />
                  {stateMeta[component.state].label}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-zt-muted">
          Updated {formatDate(status.updatedAt)}
        </p>
      </PanelContent>
    </Panel>
  );
}
