import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_LEVELS,
  NOTIFICATION_TYPES,
  ROUTES,
  type NotificationCategory,
} from "@/lib/constants";
import { getAuthenticatedUser } from "@/services/auth";
import { listProjects } from "@/services/dashboard/projects.service";
import {
  getNotificationCounts,
  getNotificationPreferences,
  listDashboardNotifications,
  listDeliveryActivity,
  listRetryQueue,
} from "@/services/notifications";
import type {
  NotificationArchiveFilter,
  NotificationReadFilter,
} from "@/services/notifications";
import { createSupabaseServerClient } from "@/supabase/server";
import { NotificationsExplorer } from "@/features/notifications/components/notifications-explorer";
import { NotificationPreferencesForm } from "@/features/notifications/components/preferences-form";
import { DeliveryPanel } from "@/features/notifications/components/delivery-panel";
import type { NotificationLevel, NotificationType } from "@/types/database";

export const metadata: Metadata = { title: "Notifications" };

const PAGE_SIZE = 20;

interface NotificationsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    read?: string;
    archived?: string;
    category?: string;
    type?: string;
    level?: string;
    projectId?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    redirect(ROUTES.login);
  }

  const read = (["unread", "read"].includes(params.read ?? "")
    ? params.read
    : "all") as NotificationReadFilter;
  const archived = (
    params.archived === "archived" || params.archived === "all"
      ? params.archived
      : "active"
  ) as NotificationArchiveFilter;

  const category = NOTIFICATION_CATEGORIES.find((v) => v === params.category) as
    | NotificationCategory
    | undefined;
  const type = NOTIFICATION_TYPES.find((v) => v === params.type) as
    | NotificationType
    | undefined;
  const level = NOTIFICATION_LEVELS.find((v) => v === params.level) as
    | NotificationLevel
    | undefined;
  const from = params.from
    ? new Date(`${params.from}T00:00:00.000Z`).toISOString()
    : undefined;
  const to = params.to
    ? new Date(`${params.to}T23:59:59.999Z`).toISOString()
    : undefined;

  const [page, counts, preferences, activity, queue, projectsPage] =
    await Promise.all([
      listDashboardNotifications(supabase, user.id, {
        page: params.page ? Number(params.page) : 1,
        pageSize: PAGE_SIZE,
        search: params.q?.trim() || undefined,
        read,
        archived,
        category,
        type,
        level,
        projectId: params.projectId || undefined,
        from,
        to,
      }),
      getNotificationCounts(supabase, user.id),
      getNotificationPreferences(supabase, user.id),
      listDeliveryActivity(supabase, user.id),
      listRetryQueue(supabase, user.id),
      listProjects({ page: 1, pageSize: 100 }),
    ]);

  const projects = projectsPage.items.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Manage your inbox, delivery channels, and notification preferences."
      />

      <NotificationsExplorer
        notifications={page.items}
        projects={projects}
        counts={counts}
        total={page.total}
        page={page.page}
        pageSize={page.pageSize}
        search={params.q?.trim() ?? ""}
        filters={{
          read: params.read ?? "",
          archived: params.archived ?? "",
          category: params.category ?? "",
          type: params.type ?? "",
          level: params.level ?? "",
          projectId: params.projectId ?? "",
          from: params.from ?? "",
          to: params.to ?? "",
        }}
      />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zt-text">Delivery</h2>
        <DeliveryPanel activity={activity} queue={queue} />
      </div>

      <FadeIn delay={0.08}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Notification preferences</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <NotificationPreferencesForm preferences={preferences} />
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}
