import {
  Panel,
  PanelContent,
} from "@/components/dashboard/panel";
import { Badge } from "@/components/dashboard/badge";
import { ERROR_LEVEL_TONE } from "@/features/errors/lib/level-tone";
import type { ErrorAnalytics } from "@/features/errors/types";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

interface ErrorAnalyticsStripProps {
  analytics: ErrorAnalytics;
}

export function ErrorAnalyticsStrip({ analytics }: ErrorAnalyticsStripProps) {
  if (analytics.totalGroups === 0) return null;

  return (
    <Panel>
      <PanelContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Error groups" value={formatNumber(analytics.totalGroups)} />
          <Stat
            label="Total occurrences"
            value={formatNumber(analytics.totalOccurrences)}
          />
          <Stat
            label="Active (7d)"
            value={formatNumber(analytics.unresolvedCount)}
          />
          <Stat
            label="Quiet (7d+)"
            value={formatNumber(analytics.resolvedCount)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-zt-border pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zt-muted">
              By severity
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analytics.byLevel.map((item) => (
                <Badge key={item.level} tone={ERROR_LEVEL_TONE[item.level]}>
                  {item.level} · {item.count}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zt-muted">
              By environment
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analytics.byEnvironment.map((item) => (
                <Badge key={item.environment} tone="default">
                  {item.environment} · {item.count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zt-text">
        {value}
      </p>
    </div>
  );
}
