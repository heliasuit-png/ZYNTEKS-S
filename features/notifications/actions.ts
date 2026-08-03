"use server";

import { revalidatePath } from "next/cache";

import {
  DASHBOARD_ROUTES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
} from "@/lib/constants";
import { createSupabaseServerClient } from "@/supabase/server";
import { getAuthenticatedUser } from "@/services/auth";
import {
  archiveNotification,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  unarchiveNotification,
  updateNotificationPreferences,
} from "@/services/notifications";
import { notificationPreferencesSchema } from "@/features/notifications/schemas";
import type { TypePreferencesMap } from "@/features/notifications/lib/categories";
import type { PreferencesFormState } from "@/features/notifications/types";
import type { Json } from "@/types/database";

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  return { supabase, user };
}

function revalidateNotificationViews() {
  revalidatePath(DASHBOARD_ROUTES.notifications);
  revalidatePath(DASHBOARD_ROUTES.dashboard);
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await markNotificationRead(supabase, user.id, id);
  revalidateNotificationViews();
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await markAllNotificationsRead(supabase, user.id);
  revalidateNotificationViews();
}

export async function archiveNotificationAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await archiveNotification(supabase, user.id, id);
  revalidateNotificationViews();
}

export async function unarchiveNotificationAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await unarchiveNotification(supabase, user.id, id);
  revalidateNotificationViews();
}

export async function deleteNotificationAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase, user } = await resolveUser();
  if (!user) return;
  await deleteNotification(supabase, user.id, id);
  revalidateNotificationViews();
}

function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true";
}

function parseTypePreferencesFromForm(formData: FormData): TypePreferencesMap {
  const map: TypePreferencesMap = {};
  for (const category of NOTIFICATION_CATEGORIES) {
    const channels: Record<string, boolean> = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      channels[channel] = checkbox(
        formData,
        `type_${category}_${channel}`,
      );
    }
    map[category] = {
      email: channels.email,
      dashboard: channels.dashboard,
      slack: channels.slack,
      discord: channels.discord,
    };
  }
  return map;
}

export async function updateNotificationPreferencesAction(
  _prevState: PreferencesFormState,
  formData: FormData,
): Promise<PreferencesFormState> {
  const typePreferences = parseTypePreferencesFromForm(formData);
  const parsed = notificationPreferencesSchema.safeParse({
    email_enabled: checkbox(formData, "email_enabled"),
    dashboard_enabled: checkbox(formData, "dashboard_enabled"),
    slack_enabled: checkbox(formData, "slack_enabled"),
    slack_webhook_url: formData.get("slack_webhook_url") ?? "",
    discord_enabled: checkbox(formData, "discord_enabled"),
    discord_webhook_url: formData.get("discord_webhook_url") ?? "",
    type_preferences: typePreferences,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Invalid input." };
  }

  const { supabase, user } = await resolveUser();
  if (!user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await updateNotificationPreferences(supabase, user.id, {
      email_enabled: parsed.data.email_enabled,
      dashboard_enabled: parsed.data.dashboard_enabled,
      slack_enabled: parsed.data.slack_enabled,
      slack_webhook_url: parsed.data.slack_webhook_url || null,
      discord_enabled: parsed.data.discord_enabled,
      discord_webhook_url: parsed.data.discord_webhook_url || null,
      type_preferences: parsed.data.type_preferences as unknown as Json,
    });
    revalidateNotificationViews();
    return { status: "success", message: "Preferences saved." };
  } catch {
    return { status: "error", message: "Could not save preferences." };
  }
}
