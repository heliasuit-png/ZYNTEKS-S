"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Bell,
  Check,
  Search,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { FadeIn } from "@/components/dashboard/motion";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_LEVELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import {
  archiveNotificationAction,
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  unarchiveNotificationAction,
} from "@/features/notifications/actions";
import type { DashboardNotification, NotificationCounts } from "@/services/notifications";
import type { NotificationLevel } from "@/types/database";

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

const iconButton =
  "rounded-lg p-1.5 text-zt-muted transition-colors hover:text-zt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/40";

const levelTone: Record<NotificationLevel, BadgeProps["tone"]> = {
  info: "primary",
  success: "success",
  warning: "warning",
  error: "danger",
};

interface ProjectOption {
  id: string;
  name: string;
}

interface NotificationsFilters {
  read: string;
  archived: string;
  category: string;
  type: string;
  level: string;
  projectId: string;
  from: string;
  to: string;
}

interface NotificationsExplorerProps {
  notifications: DashboardNotification[];
  projects: ProjectOption[];
  counts: NotificationCounts;
  total: number;
  page: number;
  pageSize: number;
  search: string;
  filters: NotificationsFilters;
}

export function NotificationsExplorer({
  notifications,
  projects,
  counts,
  total,
  page,
  pageSize,
  search,
  filters,
}: NotificationsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const isFirstRender = useRef(true);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      if (searchValue === search) return;
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) params.set("q", searchValue.trim());
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchValue, search, pathname, router, searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function goToPage(nextPage: number) {
    updateParam("page", String(nextPage));
  }

  function clearFilters() {
    router.replace(pathname);
  }

  const hasActiveFilters =
    Boolean(search) ||
    Object.values(filters).some((value) => Boolean(value));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Unread", value: counts.unread },
          { label: "Read", value: counts.read },
          { label: "Archived", value: counts.archived },
          { label: "Total", value: counts.total },
        ].map((stat) => (
          <FadeIn key={stat.label}>
            <div className="rounded-2xl border border-zt-border bg-zt-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zt-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-zt-text">
                {stat.value}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
            aria-hidden
          />
          <label className="sr-only" htmlFor="notification-search">
            Search notifications
          </label>
          <input
            id="notification-search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search title, message, project, or type…"
            className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
          />
        </div>
        {counts.unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="h-9 rounded-xl border border-zt-border px-3 text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Filter by read state"
          className={selectClass}
          value={filters.read}
          onChange={(event) => updateParam("read", event.target.value)}
        >
          <option value="">Read status: All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select
          aria-label="Filter by archive state"
          className={selectClass}
          value={filters.archived}
          onChange={(event) => updateParam("archived", event.target.value)}
        >
          <option value="">Inbox</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select
          aria-label="Filter by category"
          className={selectClass}
          value={filters.category}
          onChange={(event) => updateParam("category", event.target.value)}
        >
          <option value="">Type: All</option>
          {NOTIFICATION_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {NOTIFICATION_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by event type"
          className={selectClass}
          value={filters.type}
          onChange={(event) => updateParam("type", event.target.value)}
        >
          <option value="">Event: All</option>
          {NOTIFICATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {NOTIFICATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          className={selectClass}
          value={filters.level}
          onChange={(event) => updateParam("level", event.target.value)}
        >
          <option value="">Priority: All</option>
          {NOTIFICATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by project"
          className={selectClass}
          value={filters.projectId}
          onChange={(event) => updateParam("projectId", event.target.value)}
        >
          <option value="">Project: All</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="notif-from">
          From date
        </label>
        <input
          id="notif-from"
          type="date"
          className={selectClass}
          value={filters.from}
          onChange={(event) => updateParam("from", event.target.value)}
        />
        <label className="sr-only" htmlFor="notif-to">
          To date
        </label>
        <input
          id="notif-to"
          type="date"
          className={selectClass}
          value={filters.to}
          onChange={(event) => updateParam("to", event.target.value)}
        />
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="h-9 rounded-xl border border-zt-border px-3 text-sm text-zt-muted transition-colors hover:text-zt-text"
          >
            Clear
          </button>
        ) : null}
      </div>

      <FadeIn>
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={hasActiveFilters ? "No matching notifications" : "No notifications"}
            description={
              hasActiveFilters
                ? "Try adjusting search or filters."
                : "You're all caught up. New notifications will show up here."
            }
          />
        ) : (
          <ul className="divide-y divide-zt-border rounded-2xl border border-zt-border bg-zt-surface px-4">
            {notifications.map((notification, index) => (
              <li
                key={notification.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.read ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-zt-primary"
                        aria-label="Unread"
                      />
                    ) : null}
                    <p className="text-sm font-medium text-zt-text">
                      {notification.title}
                    </p>
                    <Badge tone={levelTone[notification.level]}>
                      {notification.level}
                    </Badge>
                    <Badge tone="default">
                      {NOTIFICATION_CATEGORY_LABELS[notification.category]}
                    </Badge>
                    {notification.archived ? (
                      <Badge tone="default">Archived</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-zt-muted">{notification.body}</p>
                  <p className="text-xs text-zt-muted">
                    {notification.projectName
                      ? `${notification.projectName} · `
                      : ""}
                    {NOTIFICATION_TYPE_LABELS[notification.type]} ·{" "}
                    <time dateTime={notification.createdAt}>
                      {formatRelativeTime(notification.createdAt)} (
                      {formatDateTime(notification.createdAt)})
                    </time>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!notification.read ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button
                        type="submit"
                        aria-label="Mark as read"
                        className={iconButton}
                      >
                        <Check className="size-4" aria-hidden />
                      </button>
                    </form>
                  ) : null}
                  {notification.archived ? (
                    <form action={unarchiveNotificationAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button
                        type="submit"
                        aria-label="Unarchive"
                        className={iconButton}
                      >
                        <ArchiveRestore className="size-4" aria-hidden />
                      </button>
                    </form>
                  ) : (
                    <form action={archiveNotificationAction}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button
                        type="submit"
                        aria-label="Archive"
                        className={iconButton}
                      >
                        <Archive className="size-4" aria-hidden />
                      </button>
                    </form>
                  )}
                  <form action={deleteNotificationAction}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button
                      type="submit"
                      aria-label="Delete"
                      className="rounded-lg p-1.5 text-zt-muted transition-colors hover:text-zt-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/40"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FadeIn>

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      ) : null}
    </div>
  );
}
