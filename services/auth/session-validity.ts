import type { TypedSupabaseClient } from "@/supabase/client";

type Supabase = TypedSupabaseClient;

/**
 * SHA-256 hex digest of an access token (matches user_sessions.session_token_hash).
 * Uses Web Crypto so this module is safe to import from Edge middleware.
 */
export async function hashAccessToken(accessToken: string): Promise<string> {
  const data = new TextEncoder().encode(accessToken);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reads the JWT `iat` claim without verifying the signature.
 * Callers must only use this after `auth.getUser()` has validated the token.
 */
export function getJwtIssuedAtSeconds(accessToken: string): number | null {
  const parts = accessToken.split(".");
  if (parts.length < 2 || !parts[1]) {
    return null;
  }
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { iat?: unknown };
    return typeof payload.iat === "number" && Number.isFinite(payload.iat)
      ? payload.iat
      : null;
  } catch {
    return null;
  }
}

/**
 * Returns true when this access token must be treated as logged-out:
 * - profile status is banned (suspended account),
 * - matching user_sessions row is revoked, or
 * - JWT iat is at/before profiles.sessions_invalidated_at (global logout).
 */
export async function isAccessTokenInvalidated(
  supabase: Supabase,
  userId: string,
  accessToken: string,
): Promise<boolean> {
  const tokenHash = await hashAccessToken(accessToken);
  const iat = getJwtIssuedAtSeconds(accessToken);

  const [profileResult, sessionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("sessions_invalidated_at, status")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_sessions")
      .select("revoked_at")
      .eq("user_id", userId)
      .eq("session_token_hash", tokenHash)
      .maybeSingle(),
  ]);

  if (profileResult.data?.status === "banned") {
    return true;
  }

  if (sessionResult.data?.revoked_at) {
    return true;
  }

  const invalidatedAt = profileResult.data?.sessions_invalidated_at;
  if (!invalidatedAt || iat === null) {
    return false;
  }

  const invalidatedMs = Date.parse(invalidatedAt);
  if (!Number.isFinite(invalidatedMs)) {
    return false;
  }

  // Reject tokens issued at or before the invalidation stamp.
  return iat * 1000 <= invalidatedMs;
}

/**
 * Marks every app-tracked session revoked and stamps global invalidation time
 * so in-flight access JWTs are rejected by {@link isAccessTokenInvalidated}.
 * Returns how many previously-active session rows were revoked.
 */
export async function markAllSessionsInvalidated(
  supabase: Supabase,
  userId: string,
  accessToken?: string | null,
): Promise<number> {
  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ sessions_invalidated_at: now })
    .eq("id", userId);
  if (profileError) {
    throw profileError;
  }

  const { data: revokedRows, error: revokeError } = await supabase
    .from("user_sessions")
    .update({
      revoked_at: now,
      is_current: false,
    })
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id");
  if (revokeError) {
    throw revokeError;
  }

  let count = revokedRows?.length ?? 0;

  // Guarantee the current access token hash is recorded as revoked even when
  // touchSession never created a row for this browser.
  if (accessToken) {
    const tokenHash = await hashAccessToken(accessToken);
    const { data: existing } = await supabase
      .from("user_sessions")
      .select("id, revoked_at")
      .eq("user_id", userId)
      .eq("session_token_hash", tokenHash)
      .maybeSingle();

    if (existing) {
      if (!existing.revoked_at) {
        const { error } = await supabase
          .from("user_sessions")
          .update({ revoked_at: now, is_current: false })
          .eq("id", existing.id);
        if (error) {
          throw error;
        }
        count += 1;
      }
    } else {
      const { error } = await supabase.from("user_sessions").insert({
        user_id: userId,
        session_token_hash: tokenHash,
        device_label: "Signed out",
        is_current: false,
        revoked_at: now,
        last_active_at: now,
      });
      if (error) {
        throw error;
      }
      count += 1;
    }
  }

  return count;
}
