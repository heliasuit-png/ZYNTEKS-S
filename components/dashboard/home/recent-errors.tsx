import Link from "next/link";
import { Bug } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/dashboard/badge";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { ERROR_LEVEL_TONE } from "@/features/errors/lib/level-tone";
import { formatRelativeTime } from "@/utils/format";
import type { ErrorEvent } from "@/types/dashboard";

export function RecentErrors({ errors }: { errors: ErrorEvent[] }) {
  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>Recent Errors</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {errors.length === 0 ? (
          <EmptyState
            icon={Bug}
            title="No errors reported"
            description="Errors captured across your projects will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {errors.map((error) => (
              <li key={error.id}>
                <Link
                  href={`${DASHBOARD_ROUTES.errors}/${error.id}`}
                  className="flex items-start justify-between gap-3 transition-colors hover:opacity-90"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zt-text hover:text-zt-primary">
                      {error.message}
                    </p>
                    <p className="truncate text-xs text-zt-muted">
                      {error.projectName} · {error.occurrences}× ·{" "}
                      {formatRelativeTime(error.lastSeenAt)}
                    </p>
                  </div>
                  <Badge tone={ERROR_LEVEL_TONE[error.level]}>
                    {error.level}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}
