import "server-only";

import { renderNotificationEmail, sendEmail } from "@/emails";
import type { EmailDetail } from "@/emails/types";
import { APP_NAME, MONITORING } from "@/lib/constants";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  categoryForType,
  isCategoryChannelEnabled,
  parseTypePreferences,
} from "@/features/notifications/lib/categories";
import { composeNotification } from "./composer";
import type { ComposedNotification, NotificationEvent } from "./types";
import type { TypedSupabaseClient } from "@/supabase/client";
import type {
  Database,
  Json,
  NotificationChannel,
} from "@/types/database";

type Supabase = TypedSupabaseClient;
type QueueRow = Database["public"]["Tables"]["notification_queue"]["Row"];
type QueueInsert = Database["public"]["Tables"]["notification_queue"]["Insert"];
type PreferencesRow =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

interface DispatchCache {
  emails: Map<string, string | null>;
  prefs: Map<string, PreferencesRow>;
}

function createCache(): DispatchCache {
  return { emails: new Map(), prefs: new Map() };
}

function emptyPreferences(userId: string): PreferencesRow {
  return {
    id: "",
    user_id: userId,
    email_enabled: true,
    dashboard_enabled: true,
    slack_enabled: false,
    slack_webhook_url: null,
    discord_enabled: false,
    discord_webhook_url: null,
    type_preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Loads a user's preferences, creating defaults on first use. */
export async function getOrCreatePreferences(
  admin: Supabase,
  userId: string,
): Promise<PreferencesRow> {
  const { data: existing } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await admin
    .from("notification_preferences")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error || !data) {
    return emptyPreferences(userId);
  }
  return data;
}

async function getPreferencesCached(
  admin: Supabase,
  userId: string,
  cache: DispatchCache,
): Promise<PreferencesRow> {
  const cached = cache.prefs.get(userId);
  if (cached) {
    return cached;
  }
  const prefs = await getOrCreatePreferences(admin, userId);
  cache.prefs.set(userId, prefs);
  return prefs;
}

async function getEmailCached(
  admin: Supabase,
  userId: string,
  cache: DispatchCache,
): Promise<string | null> {
  if (cache.emails.has(userId)) {
    return cache.emails.get(userId) ?? null;
  }
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = data?.email ?? null;
  cache.emails.set(userId, email);
  return email;
}

/** Returns true if a notification for this exact entity was already recorded. */
export async function alreadyNotified(
  admin: Supabase,
  params: {
    userId: string;
    type: NotificationEvent["type"];
    dedupeKey: string;
    dedupeValue: string;
  },
): Promise<boolean> {
  const { count } = await admin
    .from("notification_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .filter(`data->>${params.dedupeKey}`, "eq", params.dedupeValue);
  return (count ?? 0) > 0;
}

function buildData(composed: ComposedNotification): Json {
  return {
    ...composed.data,
    [composed.dedupeKey]: composed.dedupeValue,
    __details: composed.details,
    __actionPath: composed.actionPath,
    __actionLabel: composed.actionLabel,
  } as unknown as Json;
}

function channelsFor(
  prefs: PreferencesRow,
  type: NotificationEvent["type"],
): NotificationChannel[] {
  const typePrefs = parseTypePreferences(prefs.type_preferences);
  const category = categoryForType(type);
  const channels: NotificationChannel[] = [];

  if (
    prefs.dashboard_enabled &&
    isCategoryChannelEnabled(typePrefs, category, "dashboard")
  ) {
    channels.push("dashboard");
  }
  if (
    prefs.email_enabled &&
    isCategoryChannelEnabled(typePrefs, category, "email")
  ) {
    channels.push("email");
  }
  if (
    prefs.slack_enabled &&
    prefs.slack_webhook_url &&
    isCategoryChannelEnabled(typePrefs, category, "slack")
  ) {
    channels.push("slack");
  }
  if (
    prefs.discord_enabled &&
    prefs.discord_webhook_url &&
    isCategoryChannelEnabled(typePrefs, category, "discord")
  ) {
    channels.push("discord");
  }
  return channels;
}

/**
 * Raises a notification: composes content, enqueues one row per enabled
 * channel, and attempts immediate delivery. Retries are handled by the cron
 * queue processor.
 */
export async function dispatchNotification(
  admin: Supabase,
  event: NotificationEvent,
): Promise<void> {
  const composed = composeNotification(event);
  const prefs = await getOrCreatePreferences(admin, event.userId);
  const channels = channelsFor(prefs, composed.type);
  if (channels.length === 0) {
    return;
  }

  const data = buildData(composed);
  const rows: QueueInsert[] = channels.map((channel) => ({
    user_id: event.userId,
    project_id: event.projectId ?? null,
    type: composed.type,
    channel,
    level: composed.level,
    title: composed.title,
    body: composed.body,
    data,
    status: "pending",
  }));

  const { data: inserted, error } = await admin
    .from("notification_queue")
    .insert(rows)
    .select("*");

  if (error || !inserted) {
    logger.warn("Failed to enqueue notification", { error: error?.message });
    return;
  }

  const cache = createCache();
  cache.prefs.set(event.userId, prefs);
  for (const row of inserted) {
    await processRow(admin, row, cache);
  }
}

/** Processes pending queued notifications (invoked by the cron job). */
export async function processQueue(
  admin: Supabase,
  limit = MONITORING.queueBatchSize,
): Promise<{ processed: number }> {
  const nowIso = new Date().toISOString();
  const { data: rows } = await admin
    .from("notification_queue")
    .select("*")
    .in("status", ["pending", "processing"])
    .lte("scheduled_for", nowIso)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rows || rows.length === 0) {
    return { processed: 0 };
  }

  const cache = createCache();
  let processed = 0;
  for (const row of rows) {
    await processRow(admin, row, cache);
    processed += 1;
  }
  return { processed };
}

function readData(row: QueueRow): Record<string, unknown> {
  return (row.data ?? {}) as Record<string, unknown>;
}

async function markProcessing(admin: Supabase, id: string): Promise<void> {
  await admin
    .from("notification_queue")
    .update({ status: "processing" })
    .eq("id", id)
    .in("status", ["pending", "processing"]);
}

async function processRow(
  admin: Supabase,
  row: QueueRow,
  cache: DispatchCache,
): Promise<void> {
  await markProcessing(admin, row.id);

  try {
    const prefs = await getPreferencesCached(admin, row.user_id, cache);
    const typePrefs = parseTypePreferences(prefs.type_preferences);
    const category = categoryForType(row.type);
    const channelStillEnabled =
      (row.channel === "dashboard" && prefs.dashboard_enabled) ||
      (row.channel === "email" && prefs.email_enabled) ||
      (row.channel === "slack" &&
        prefs.slack_enabled &&
        Boolean(prefs.slack_webhook_url)) ||
      (row.channel === "discord" &&
        prefs.discord_enabled &&
        Boolean(prefs.discord_webhook_url));

    if (
      !channelStillEnabled ||
      !isCategoryChannelEnabled(typePrefs, category, row.channel)
    ) {
      await writeLog(admin, row, { status: "skipped" });
      await markSkipped(admin, row.id, "Channel or type disabled in preferences");
      return;
    }

    if (row.channel === "dashboard") {
      await writeLog(admin, row, { status: "sent" });
      await markSent(admin, row.id);
      return;
    }

    if (row.channel === "email") {
      const email = await getEmailCached(admin, row.user_id, cache);
      if (!email) {
        await failRow(admin, row, "No email address on file");
        return;
      }
      const data = readData(row);
      const details = Array.isArray(data.__details)
        ? (data.__details as EmailDetail[])
        : [];
      const actionPath =
        typeof data.__actionPath === "string" ? data.__actionPath : undefined;
      const actionLabel =
        typeof data.__actionLabel === "string" ? data.__actionLabel : undefined;
      const rendered = renderNotificationEmail({
        type: row.type,
        subject: row.title,
        heading: row.title,
        intro: row.body,
        details,
        actionUrl: actionPath
          ? `${env.NEXT_PUBLIC_APP_URL}${actionPath}`
          : undefined,
        actionLabel,
        appName: APP_NAME,
      });
      const result = await sendEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      await writeLog(admin, row, {
        status: result.ok ? "sent" : "failed",
        providerMessageId: result.id,
        error: result.error,
      });
      if (result.ok) {
        await markSent(admin, row.id);
      } else {
        await failRow(admin, row, result.error ?? "Email delivery failed");
      }
      return;
    }

    const webhookUrl =
      row.channel === "slack"
        ? prefs.slack_webhook_url
        : prefs.discord_webhook_url;
    if (!webhookUrl) {
      await failRow(admin, row, "No webhook configured");
      return;
    }
    const ok = await postWebhook(row.channel, webhookUrl, row.title, row.body);
    await writeLog(admin, row, {
      status: ok ? "sent" : "failed",
      error: ok ? undefined : "Webhook delivery failed",
    });
    if (ok) {
      await markSent(admin, row.id);
    } else {
      await failRow(admin, row, "Webhook delivery failed");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await failRow(admin, row, message);
  }
}

async function writeLog(
  admin: Supabase,
  row: QueueRow,
  options: {
    status: "sent" | "failed" | "skipped";
    providerMessageId?: string | null;
    error?: string;
  },
): Promise<void> {
  await admin.from("notification_logs").insert({
    user_id: row.user_id,
    project_id: row.project_id,
    queue_id: row.id,
    type: row.type,
    channel: row.channel,
    level: row.level,
    title: row.title,
    body: row.body,
    data: row.data,
    status: options.status,
    provider_message_id: options.providerMessageId ?? null,
    error: options.error ?? null,
  });
}

async function markSent(admin: Supabase, id: string): Promise<void> {
  await admin
    .from("notification_queue")
    .update({ status: "sent", processed_at: new Date().toISOString() })
    .eq("id", id);
}

async function markSkipped(
  admin: Supabase,
  id: string,
  reason: string,
): Promise<void> {
  await admin
    .from("notification_queue")
    .update({
      status: "skipped",
      last_error: reason,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function failRow(
  admin: Supabase,
  row: QueueRow,
  reason: string,
): Promise<void> {
  const attempts = row.attempts + 1;
  const exhausted = attempts >= MONITORING.maxDeliveryAttempts;
  const nextAttempt = new Date(Date.now() + attempts * 60 * 1000).toISOString();
  await admin
    .from("notification_queue")
    .update({
      status: exhausted ? "failed" : "pending",
      attempts,
      last_error: reason,
      scheduled_for: exhausted ? row.scheduled_for : nextAttempt,
      processed_at: exhausted ? new Date().toISOString() : null,
    })
    .eq("id", row.id);

  if (exhausted && row.channel !== "dashboard") {
    // Ensure a terminal failure is visible in the delivery log when retries end
    // without a prior failed log row (e.g. webhook throw before writeLog).
    const { count } = await admin
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("queue_id", row.id)
      .eq("status", "failed");
    if ((count ?? 0) === 0) {
      await writeLog(admin, row, { status: "failed", error: reason });
    }
  }
}

async function postWebhook(
  channel: "slack" | "discord",
  url: string,
  title: string,
  body: string,
): Promise<boolean> {
  try {
    const payload =
      channel === "slack"
        ? { text: `*${title}*\n${body}` }
        : { content: `**${title}**\n${body}` };
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
