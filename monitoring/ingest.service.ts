import "server-only";

import { SDK_INGEST } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { computeFingerprint, normalizeTimestamp } from "@/monitoring/fingerprint";
import type {
  ErrorPayload,
  EventsPayload,
  HeartbeatPayload,
  PerformancePayload,
} from "@/monitoring/schemas";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { ApiKeyEnvironment, Database, Json } from "@/types/database";

/**
 * Ingestion service. Persists SDK telemetry using a privileged (service-role)
 * client injected by the caller. Errors are deduplicated by fingerprint within
 * the configured window.
 */

type Supabase = TypedSupabaseClient;
type ErrorInsert = Database["public"]["Tables"]["errors"]["Insert"];
type EventInsert = Database["public"]["Tables"]["error_events"]["Insert"];

export interface IngestContext {
  projectId: string;
  userId: string;
  environment: ApiKeyEnvironment;
}

function asJson(value: unknown): Json | null {
  return (value ?? null) as Json | null;
}

function persistenceError(message: string, cause: unknown): AppError {
  return new AppError(message, { isOperational: false, cause });
}

export async function ingestError(
  admin: Supabase,
  ctx: IngestContext,
  payload: ErrorPayload,
): Promise<{ deduped: boolean }> {
  const fingerprint = computeFingerprint(
    payload.message,
    payload.stack ?? null,
    payload.url ?? null,
  );
  const environment = payload.environment ?? ctx.environment;
  const now = new Date();
  const nowIso = now.toISOString();
  const windowStart = new Date(
    now.getTime() - SDK_INGEST.dedupWindowMs,
  ).toISOString();

  const sharedContext = {
    url: payload.url ?? null,
    browser: asJson(payload.browser),
    os: asJson(payload.os),
    device: asJson(payload.device),
    screen: asJson(payload.screen),
    language: payload.language ?? null,
    timezone: payload.timezone ?? null,
    performance: asJson(payload.performance),
    network: asJson(payload.network),
    memory: asJson(payload.memory),
    environment,
    release: payload.release ?? null,
  };

  const { data: existing } = await admin
    .from("errors")
    .select("id, occurrences")
    .eq("project_id", ctx.projectId)
    .eq("fingerprint", fingerprint)
    .gte("last_seen", windowStart)
    .order("last_seen", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("errors")
      .update({
        occurrences: existing.occurrences + 1,
        last_seen: nowIso,
        ...sharedContext,
      })
      .eq("id", existing.id);
    if (error) {
      throw persistenceError("Failed to update error group.", error);
    }
    return { deduped: true };
  }

  const insert: ErrorInsert = {
    project_id: ctx.projectId,
    user_id: ctx.userId,
    fingerprint,
    message: payload.message,
    stack: payload.stack ?? null,
    type: payload.type ?? null,
    level: payload.level ?? "error",
    occurrences: 1,
    first_seen: normalizeTimestamp(payload.timestamp, nowIso),
    last_seen: nowIso,
    ...sharedContext,
  };

  const { error } = await admin.from("errors").insert(insert);
  if (error) {
    throw persistenceError("Failed to record error.", error);
  }
  return { deduped: false };
}

export async function ingestHeartbeat(
  admin: Supabase,
  ctx: IngestContext,
  payload: HeartbeatPayload,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("heartbeats").insert({
    project_id: ctx.projectId,
    user_id: ctx.userId,
    memory: asJson(payload.memory),
    uptime: payload.uptime ?? null,
    page: payload.page ?? null,
    environment: payload.environment ?? ctx.environment,
    release: payload.release ?? null,
    occurred_at: normalizeTimestamp(payload.timestamp, nowIso),
  });
  if (error) {
    throw persistenceError("Failed to record heartbeat.", error);
  }
}

export async function ingestPerformance(
  admin: Supabase,
  ctx: IngestContext,
  payload: PerformancePayload,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("performance_logs").insert({
    project_id: ctx.projectId,
    user_id: ctx.userId,
    url: payload.url ?? null,
    page_load: payload.pageLoad ?? null,
    fcp: payload.fcp ?? null,
    lcp: payload.lcp ?? null,
    cls: payload.cls ?? null,
    inp: payload.inp ?? null,
    ttfb: payload.ttfb ?? null,
    navigation: asJson(payload.navigation),
    environment: payload.environment ?? ctx.environment,
    release: payload.release ?? null,
    occurred_at: normalizeTimestamp(payload.timestamp, nowIso),
  });
  if (error) {
    throw persistenceError("Failed to record performance metrics.", error);
  }
}

export async function ingestEvents(
  admin: Supabase,
  ctx: IngestContext,
  payload: EventsPayload,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const environment = payload.environment ?? ctx.environment;

  const rows: EventInsert[] = payload.events.map((event) => ({
    project_id: ctx.projectId,
    user_id: ctx.userId,
    type: event.type,
    name: event.name ?? null,
    level: event.level ?? "info",
    message: event.message ?? null,
    url: event.url ?? null,
    metadata: (event.metadata ?? {}) as Json,
    environment,
    release: payload.release ?? null,
    occurred_at: normalizeTimestamp(event.timestamp, nowIso),
  }));

  const { error } = await admin.from("error_events").insert(rows);
  if (error) {
    throw persistenceError("Failed to record events.", error);
  }
}
