"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import { FadeIn } from "@/components/dashboard/motion";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
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
  const { dict, locale } = useDictionary();
  const t = dict.dash.notifications;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FadeIn>
        <section className="rounded-2xl border border-zt-border bg-zt-surface p-4">
          <h3 className="text-sm font-medium text-zt-text">{t.deliveryTitle}</h3>
          <p className="mt-1 text-xs text-zt-muted">{t.deliveryDesc}</p>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-zt-muted">{t.deliveryEmpty}</p>
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
                      {t.channels[item.channel]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zt-muted">
                    {t.categories[item.category]} ·{" "}
                    {formatRelativeTime(item.createdAt, undefined, locale)} (
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
          <h3 className="text-sm font-medium text-zt-text">{t.retryQueueTitle}</h3>
          <p className="mt-1 text-xs text-zt-muted">{t.retryQueueDesc}</p>
          {queue.length === 0 ? (
            <p className="mt-6 text-sm text-zt-muted">{t.retryQueueEmpty}</p>
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
                      {t.channels[item.channel]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zt-muted">
                    {t.attemptScheduled
                      .replace("{n}", String(item.attempts))
                      .replace("{rel}", formatRelativeTime(item.scheduledFor, undefined, locale))}
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
