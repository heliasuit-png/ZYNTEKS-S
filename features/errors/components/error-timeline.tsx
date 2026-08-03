import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { ErrorTimelineEvent } from "@/features/errors/types";

const toneDot: Record<ErrorTimelineEvent["tone"], string> = {
  danger: "bg-zt-danger",
  warning: "bg-zt-warning",
  primary: "bg-zt-primary",
  success: "bg-zt-success",
  default: "bg-zt-muted",
};

interface ErrorTimelineProps {
  events: ErrorTimelineEvent[];
}

export function ErrorTimeline({ events }: ErrorTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zt-muted">No timeline events yet.</p>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-zt-border pl-5">
      {events.map((event, index) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[23px] top-1.5 size-2.5 rounded-full ring-4 ring-zt-bg",
              toneDot[event.tone],
            )}
            aria-hidden
          />
          <p className="text-xs text-zt-muted">{formatDateTime(event.at)}</p>
          <p className="mt-0.5 text-sm font-medium text-zt-text">{event.title}</p>
          {event.detail ? (
            <p className="mt-0.5 text-xs text-zt-muted">{event.detail}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
