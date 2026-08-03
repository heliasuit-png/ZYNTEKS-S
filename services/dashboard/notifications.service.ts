import { emptyPage } from "@/services/dashboard/pagination";
import { getAuthenticatedUser } from "@/services/auth";
import {
  getUnreadNotificationCount as countUnread,
  listDashboardNotifications,
} from "@/services/notifications";
import { createSupabaseServerClient } from "@/supabase/server";
import type {
  NotificationItem,
  Paginated,
  PaginationParams,
} from "@/types/dashboard";

/**
 * Dashboard seam for notifications. Reads the current user's in-app
 * (dashboard channel) notifications and maps them to the topbar/list model.
 */
export async function listNotifications(
  params?: Partial<PaginationParams>,
): Promise<Paginated<NotificationItem>> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return emptyPage<NotificationItem>(params);
    }

    const result = await listDashboardNotifications(supabase, user.id, params);
    const items: NotificationItem[] = result.items.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.level,
      read: row.read,
      createdAt: row.createdAt,
    }));

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch {
    return emptyPage<NotificationItem>(params);
  }
}

export async function getRecentNotifications(
  limit = 5,
): Promise<NotificationItem[]> {
  const page = await listNotifications({ page: 1, pageSize: limit });
  return page.items;
}

/** Count of unread notifications, used by the topbar badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return 0;
    }
    return await countUnread(supabase, user.id);
  } catch {
    return 0;
  }
}
