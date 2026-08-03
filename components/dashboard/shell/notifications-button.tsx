"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/dashboard/dropdown";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import type { NotificationItem, NotificationType } from "@/types/dashboard";

const dotClass: Record<NotificationType, string> = {
  info: "bg-zt-primary",
  success: "bg-zt-success",
  warning: "bg-zt-warning",
  error: "bg-zt-danger",
};

interface NotificationsButtonProps {
  unreadCount: number;
  notifications: NotificationItem[];
}

export function NotificationsButton({
  unreadCount,
  notifications,
}: NotificationsButtonProps) {
  return (
    <Dropdown
      align="end"
      menuClassName="w-80"
      trigger={
        <span
          className="relative flex size-9 items-center justify-center rounded-xl border border-zt-border bg-white/[0.02] text-zt-muted transition-colors hover:border-zt-border-strong hover:text-zt-text"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell
            className={cn("size-4", unreadCount > 0 && "zt-breathe")}
            aria-hidden
          />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-zt-danger px-1 text-[10px] font-semibold text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
      }
    >
      <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zt-muted">
        Notifications
      </div>
      {notifications.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-zt-muted">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="max-h-72 overflow-y-auto">
          {notifications.map((item) => (
            <li
              key={item.id}
              className="flex gap-2 rounded-lg px-3 py-2 hover:bg-zt-surface-2"
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  dotClass[item.type],
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zt-text">
                  {item.title}
                </p>
                <p className="truncate text-xs text-zt-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={DASHBOARD_ROUTES.notifications}
        className="mt-1 block rounded-lg px-3 py-2 text-center text-sm font-medium text-zt-primary transition-colors hover:bg-zt-surface-2"
      >
        View all notifications
      </Link>
    </Dropdown>
  );
}
