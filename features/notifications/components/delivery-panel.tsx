"use client";

import { FadeIn } from "@/components/dashboard/motion";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import type {
  DeliveryActivityItem,
  RetryQueueItem,
} from "@/services/notifications";
import type { NotificationDeliveryStatus } from "@/types/database";

const statusTone: Record<NotificationDeliveryStatus, BadgeProps["tone"]> = {
  pending: "warning",
  processing: "primary",
  sent: "success",
  failed: "danger",
  skipped: "default",
};

interface DeliveryPanelProps {
  activity: DeliveryActivityItem[];
  queue: RetryQueueItem[];
}

export function DeliveryPanel({ activity, queue }: DeliveryPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FadeIn>
        <section className="rounded-2xl border border-zt-border bg-zt-surface p-4">
          <h3 className="text-sm font-medium text-zt-text">Delivery status</h3>
          <p className="mt-1 text-xs text-zt-muted">
            Email, Slack, and Discord delivery results.
          </p>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-zt-muted">
              No external deliveries yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zt-border">
              {activity.map((item) => (
                <li key={item.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zt-text">
                      {item.title}
                    </p>
                    <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                    <Badge tone="default">
                      {NOTIFICATION_CHANNEL_LABELS[item.channel]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zt-muted">
                    {NOTIFICATION_CATEGORY_LABELS[item.category]} ·{" "}
                    {formatRelativeTime(item.createdAt)} (
                    {formatDateTime(item.createdAt)})
                  </p>
                  {item.error ? (
                    <p className="text-xs text-zt-danger" role="status">
                      {item.error}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </FadeIn>

      <FadeIn delay={0.04}>
        <section className="rounded-2xl border border-zt-border bg-zt-surface p-4">
          <h3 className="text-sm font-medium text-zt-text">Retry queue</h3>
          <p className="mt-1 text-xs text-zt-muted">
            Pending, processing, and failed jobs with failure logging.
          </p>
          {queue.length === 0 ? (
            <p className="mt-6 text-sm text-zt-muted">
              Queue is clear. Nothing waiting to retry.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zt-border">
              {queue.map((item) => (
                <li key={item.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zt-text">
                      {item.title}
                    </p>
                    <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                    <Badge tone="default">
                      {NOTIFICATION_CHANNEL_LABELS[item.channel]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zt-muted">
                    Attempt {item.attempts} · scheduled{" "}
                    {formatRelativeTime(item.scheduledFor)}
                  </p>
                  {item.lastError ? (
                    <p className="text-xs text-zt-danger" role="status">
                      {item.lastError}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </FadeIn>
    </div>
  );
}
