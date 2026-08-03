import { Bell } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { formatDate } from "@/utils/format";
import type { NotificationItem, NotificationType } from "@/types/dashboard";

const typeTone: Record<NotificationType, BadgeProps["tone"]> = {
  info: "primary",
  success: "success",
  warning: "warning",
  error: "danger",
};

export function RecentNotifications({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  return (
    <Panel className="h-full">
      <PanelHeader>
        <PanelTitle>Recent Notifications</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Account and system notifications will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zt-text">
                    {notification.title}
                  </p>
                  <p className="truncate text-xs text-zt-muted">
                    {notification.body} · {formatDate(notification.createdAt)}
                  </p>
                </div>
                <Badge tone={typeTone[notification.type]}>
                  {notification.type}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </PanelContent>
    </Panel>
  );
}
