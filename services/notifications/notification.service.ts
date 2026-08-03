import {
  createPage,
  normalizePagination,
} from "@/services/dashboard/pagination";
import {
  categoryForType,
  typesForCategory,
} from "@/features/notifications/lib/categories";
import type { NotificationCategory } from "@/lib/constants";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  Database,
  NotificationLevel,
  NotificationType,
} from "@/types/database";
import type { Paginated, PaginationParams } from "@/types/dashboard";
import type {
  DashboardNotification,
  DeliveryActivityItem,
  NotificationCounts,
  NotificationPreferences,
  RetryQueueItem,
} from "./types";

/**
 * User-scoped notification service. Reads the in-app (dashboard channel) feed
 * and manages preferences. All access is protected by Row Level Security via
 * the injected user client.
 */

type Supabase = TypedSupabaseClient;
type LogRow = Database["public"]["Tables"]["notification_logs"]["Row"];
type QueueRow = Database["public"]["Tables"]["notification_queue"]["Row"];
type PreferencesUpdate =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

function projectNameFrom(row: LogRow | QueueRow): string | null {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return typeof data.projectName === "string" ? data.projectName : null;
}

function toDashboardNotification(row: LogRow): DashboardNotification {
  return {
    id: row.id,
    type: row.type,
    category: categoryForType(row.type),
    level: row.level,
    title: row.title,
    body: row.body,
    projectId: row.project_id,
    projectName: projectNameFrom(row),
    read: row.read_at !== null,
    archived: row.archived_at !== null,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  };
}

export type NotificationReadFilter = "all" | "unread" | "read";
export type NotificationArchiveFilter = "active" | "archived" | "all";

export interface ListNotificationsParams extends Partial<PaginationParams> {
  search?: string;
  category?: NotificationCategory;
  type?: NotificationType;
  level?: NotificationLevel;
  projectId?: string;
  read?: NotificationReadFilter;
  archived?: NotificationArchiveFilter;
  from?: string;
  to?: string;
}

export async function listDashboardNotifications(
  supabase: Supabase,
  userId: string,
  params: ListNotificationsParams = {},
): Promise<Paginated<DashboardNotification>> {
  const pagination = normalizePagination(params);
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  const archiveMode = params.archived ?? "active";
  const readMode = params.read ?? "all";

  let query = supabase
    .from("notification_logs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("channel", "dashboard");

  if (archiveMode === "active") {
    query = query.is("archived_at", null);
  } else if (archiveMode === "archived") {
    query = query.not("archived_at", "is", null);
  }

  if (readMode === "unread") {
    query = query.is("read_at", null);
  } else if (readMode === "read") {
    query = query.not("read_at", "is", null);
  }

  if (params.type) {
    query = query.eq("type", params.type);
  } else if (params.category) {
    const types = typesForCategory(params.category);
    if (types.length === 0) {
      return createPage([], 0, pagination);
    }
    query = query.in("type", types);
  }

  if (params.level) {
    query = query.eq("level", params.level);
  }

  if (params.projectId) {
    query = query.eq("project_id", params.projectId);
  }

  if (params.from) {
    query = query.gte("created_at", params.from);
  }
  if (params.to) {
    query = query.lte("created_at", params.to);
  }

  const search = params.search?.trim();
  if (search) {
    const like = `%${search}%`;
    query = query.or(
      [
        `title.ilike.${like}`,
        `body.ilike.${like}`,
        `data->>projectName.ilike.${like}`,
        `type.ilike.${like}`,
      ].join(","),
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return createPage(
    (data ?? []).map(toDashboardNotification),
    count ?? 0,
    pagination,
  );
}

export async function getNotificationCounts(
  supabase: Supabase,
  userId: string,
): Promise<NotificationCounts> {
  const base = () =>
    supabase
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("channel", "dashboard");

  const [unreadRes, readRes, archivedRes, totalRes] = await Promise.all([
    base().is("read_at", null).is("archived_at", null),
    base().not("read_at", "is", null).is("archived_at", null),
    base().not("archived_at", "is", null),
    base(),
  ]);

  for (const result of [unreadRes, readRes, archivedRes, totalRes]) {
    if (result.error) throw result.error;
  }

  return {
    unread: unreadRes.count ?? 0,
    read: readRes.count ?? 0,
    archived: archivedRes.count ?? 0,
    total: totalRes.count ?? 0,
  };
}

export async function getUnreadNotificationCount(
  supabase: Supabase,
  userId: string,
): Promise<number> {
  const counts = await getNotificationCounts(supabase, userId);
  return counts.unread;
}

export async function markNotificationRead(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    throw error;
  }
}

export async function markAllNotificationsRead(
  supabase: Supabase,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("channel", "dashboard")
    .is("read_at", null)
    .is("archived_at", null);
  if (error) {
    throw error;
  }
}

export async function archiveNotification(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    throw error;
  }
}

export async function unarchiveNotification(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .update({ archived_at: null })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    throw error;
  }
}

export async function deleteNotification(
  supabase: Supabase,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    throw error;
  }
}

export async function getNotificationPreferences(
  supabase: Supabase,
  userId: string,
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateNotificationPreferences(
  supabase: Supabase,
  userId: string,
  patch: PreferencesUpdate,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return data;
}

/** Recent delivery attempts across email / Slack / Discord (and failures). */
export async function listDeliveryActivity(
  supabase: Supabase,
  userId: string,
  limit = 20,
): Promise<DeliveryActivityItem[]> {
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("user_id", userId)
    .neq("channel", "dashboard")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    category: categoryForType(row.type),
    channel: row.channel,
    level: row.level,
    title: row.title,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  }));
}

/** Pending / failed / processing outbound jobs awaiting retry. */
export async function listRetryQueue(
  supabase: Supabase,
  userId: string,
  limit = 20,
): Promise<RetryQueueItem[]> {
  const { data, error } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "processing", "failed"])
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    category: categoryForType(row.type),
    channel: row.channel,
    title: row.title,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    scheduledFor: row.scheduled_for,
    createdAt: row.created_at,
  }));
}
