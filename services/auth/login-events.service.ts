import "server-only";

import { createSupabaseAdminClient } from "@/supabase/admin";
import { writeAdminAuditLog } from "@/services/admin/admin-audit.service";
import type {
  AuthLoginMethod,
  AuthLoginResult,
  Json,
} from "@/types/database";

export interface RecordLoginEventInput {
  userId?: string | null;
  email?: string | null;
  method: AuthLoginMethod;
  result?: AuthLoginResult;
  provider?: string | null;
  deviceLabel?: string | null;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  userAgent?: string | null;
  metadata?: Json;
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

  return { browser, os, deviceLabel: `${browser} on ${os}` };
}

async function detectSuspicious(input: {
  userId: string;
  ipAddress?: string | null;
  country?: string | null;
  browser?: string | null;
}): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const { data: prior } = await admin
    .from("auth_login_events")
    .select("ip_address, country, browser")
    .eq("user_id", input.userId)
    .eq("result", "success")
    .order("created_at", { ascending: false })
    .limit(25);

  if (!prior || prior.length === 0) return [];

  const reasons: string[] = [];
  const knownIps = new Set(
    prior.map((row) => row.ip_address).filter(Boolean) as string[],
  );
  const knownCountries = new Set(
    prior.map((row) => row.country).filter(Boolean) as string[],
  );
  const knownBrowsers = new Set(
    prior.map((row) => row.browser).filter(Boolean) as string[],
  );

  if (input.ipAddress && knownIps.size > 0 && !knownIps.has(input.ipAddress)) {
    reasons.push("new_ip");
  }
  if (
    input.country &&
    knownCountries.size > 0 &&
    !knownCountries.has(input.country)
  ) {
    reasons.push("unknown_country");
  }
  if (
    input.browser &&
    knownBrowsers.size > 0 &&
    !knownBrowsers.has(input.browser)
  ) {
    reasons.push("new_browser");
  }
  return reasons;
}

/** Persist a login attempt/success and update profiles.last_login_at on success. */
export async function recordLoginEvent(
  input: RecordLoginEventInput,
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const admin = createSupabaseAdminClient();
  const parsed = parseUserAgent(input.userAgent);
  const browser = input.browser ?? parsed.browser;
  const os = input.os ?? parsed.os;
  const deviceLabel = input.deviceLabel ?? parsed.deviceLabel;

  let reasons: string[] = [];
  if (input.userId && (input.result ?? "success") === "success") {
    reasons = await detectSuspicious({
      userId: input.userId,
      ipAddress: input.ipAddress,
      country: input.country,
      browser,
    });
  }

  const suspicious = reasons.length > 0;
  const result: AuthLoginResult =
    input.result === "failure"
      ? "failure"
      : suspicious
        ? "suspicious"
        : (input.result ?? "success");

  await admin.from("auth_login_events").insert({
    user_id: input.userId ?? null,
    email: input.email ?? null,
    method: input.method,
    result,
    provider: input.provider ?? null,
    device_label: deviceLabel,
    browser,
    os,
    ip_address: input.ipAddress ?? null,
    country: input.country ?? null,
    user_agent: input.userAgent ?? null,
    is_suspicious: suspicious,
    suspicion_reasons: reasons,
    metadata: input.metadata ?? {},
  });

  if (input.userId && result !== "failure") {
    await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", input.userId);
  }

  if (suspicious && input.userId) {
    try {
      await writeAdminAuditLog({
        actorId: input.userId,
        action: "auth_login_suspicious",
        targetUserId: input.userId,
        summary: `Suspicious login detected (${reasons.join(", ")})`,
        metadata: {
          method: input.method,
          provider: input.provider,
          reasons,
          ipAddress: input.ipAddress,
          country: input.country,
        },
        ipAddress: input.ipAddress,
      });
    } catch {
      // Non-blocking for product auth path.
    }
  }

  return { suspicious, reasons };
}
