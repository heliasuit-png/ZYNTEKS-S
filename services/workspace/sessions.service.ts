import "server-only";

import { createHash } from "node:crypto";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import { AppError, NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/services/workspace/audit.service";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { Database } from "@/types/database";

type Supabase = TypedSupabaseClient;
export type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"];

function mapError(error: { message: string; details?: string }) {
  return new AppError(error.message, {
    code: ERROR_CODE.BAD_REQUEST,
    statusCode: HTTP_STATUS.BAD_REQUEST,
    details: error.details,
    cause: error,
  });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseUserAgent(ua: string | null | undefined): {
  browser: string;
  os: string;
  deviceLabel: string;
} {
  const value = ua ?? "";
  let browser = "Unknown browser";
  if (/Edg\//i.test(value)) browser = "Edge";
  else if (/Chrome\//i.test(value)) browser = "Chrome";
  else if (/Firefox\//i.test(value)) browser = "Firefox";
  else if (/Safari\//i.test(value) && !/Chrome/i.test(value)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/i.test(value)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(value)) os = "macOS";
  else if (/Android/i.test(value)) os = "Android";
  else if (/iPhone|iPad/i.test(value)) os = "iOS";
  else if (/Linux/i.test(value)) os = "Linux";

  return {
    browser,
    os,
    deviceLabel: `${browser} on ${os}`,
  };
}

export interface TouchSessionInput {
  userId: string;
  accessToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  country?: string | null;
}

/** Upserts the current browser session and marks others as not current. */
export async function touchSession(
  supabase: Supabase,
  input: TouchSessionInput,
): Promise<UserSession> {
  const tokenHash = hashToken(input.accessToken);
  const parsed = parseUserAgent(input.userAgent);
  const now = new Date().toISOString();

  await supabase
    .from("user_sessions")
    .update({ is_current: false })
    .eq("user_id", input.userId)
    .neq("session_token_hash", tokenHash);

  const { data: existing } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("session_token_hash", tokenHash)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("user_sessions")
      .update({
        is_current: true,
        last_active_at: now,
        revoked_at: null,
        user_agent: input.userAgent ?? existing.user_agent,
        ip_address: input.ipAddress ?? existing.ip_address,
        country: input.country ?? existing.country,
        browser: parsed.browser,
        os: parsed.os,
        device_label: parsed.deviceLabel,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw mapError(error);
    return data;
  }

  const { data, error } = await supabase
    .from("user_sessions")
    .insert({
      user_id: input.userId,
      session_token_hash: tokenHash,
      device_label: parsed.deviceLabel,
      browser: parsed.browser,
      os: parsed.os,
      country: input.country ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      is_current: true,
      last_active_at: now,
    })
    .select("*")
    .single();

  if (error) throw mapError(error);
  return data;
}

export async function listSessions(
  supabase: Supabase,
  userId: string,
): Promise<UserSession[]> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });

  if (error) throw mapError(error);
  return data ?? [];
}

export async function revokeSession(
  supabase: Supabase,
  userId: string,
  sessionId: string,
  workspaceId?: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_sessions")
    .update({
      revoked_at: new Date().toISOString(),
      is_current: false,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw mapError(error);
  if (!data) throw new NotFoundError("Session not found");

  await writeAuditLog(supabase, {
    workspaceId: workspaceId ?? null,
    actorId: userId,
    action: "session_revoked",
    summary: `Revoked session ${data.device_label ?? sessionId}`,
    resourceType: "user_session",
    resourceId: sessionId,
  });
}

export async function revokeOtherSessions(
  supabase: Supabase,
  userId: string,
  currentAccessToken: string,
  workspaceId?: string | null,
): Promise<number> {
  const tokenHash = hashToken(currentAccessToken);
  const { data, error } = await supabase
    .from("user_sessions")
    .update({
      revoked_at: new Date().toISOString(),
      is_current: false,
    })
    .eq("user_id", userId)
    .neq("session_token_hash", tokenHash)
    .is("revoked_at", null)
    .select("id");

  if (error) throw mapError(error);

  const count = data?.length ?? 0;
  if (count > 0) {
    await writeAuditLog(supabase, {
      workspaceId: workspaceId ?? null,
      actorId: userId,
      action: "session_revoked",
      summary: `Revoked ${count} other device session${count === 1 ? "" : "s"}`,
      resourceType: "user_session",
    });
  }
  return count;
}

export async function getRecentLogins(
  supabase: Supabase,
  userId: string,
  limit = 10,
): Promise<UserSession[]> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw mapError(error);
  return data ?? [];
}
