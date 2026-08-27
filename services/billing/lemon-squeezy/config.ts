export type LemonSqueezyMode = "off" | "test" | "live";

export interface LemonSqueezyConfig {
  mode: LemonSqueezyMode;
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  allowLive: boolean;
  apiBaseUrl: string;
  /** True when test (or explicitly allowed live) credentials are complete. */
  isReady: boolean;
  /** Human-readable reason when not ready. */
  notReadyReason: string | null;
}

/**
 * Resolve mode. Default `off` → keep PlaceholderPaymentProvider.
 * `live` requires LEMON_SQUEEZY_ALLOW_LIVE=true (safety).
 */
export function resolveLemonSqueezyMode(
  env: Record<string, string | undefined> = process.env,
): LemonSqueezyMode {
  const raw = (env.LEMON_SQUEEZY_MODE ?? "off").trim().toLowerCase();
  if (raw === "test" || raw === "live" || raw === "off") return raw;
  return "off";
}

export function loadLemonSqueezyConfig(
  env: Record<string, string | undefined> = process.env,
): LemonSqueezyConfig {
  const mode = resolveLemonSqueezyMode(env);
  const apiKey = (env.LEMON_SQUEEZY_API_KEY ?? "").trim();
  const storeId = (env.LEMON_SQUEEZY_STORE_ID ?? "").trim();
  const webhookSecret = (env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "").trim();
  const allowLive =
    env.LEMON_SQUEEZY_ALLOW_LIVE === "true" ||
    env.LEMON_SQUEEZY_ALLOW_LIVE === "1";
  const apiBaseUrl = (
    env.LEMON_SQUEEZY_API_BASE_URL ?? "https://api.lemonsqueezy.com/v1"
  )
    .trim()
    .replace(/\/+$/, "");

  const base: LemonSqueezyConfig = {
    mode,
    apiKey,
    storeId,
    webhookSecret,
    allowLive,
    apiBaseUrl,
    isReady: false,
    notReadyReason: null,
  };

  if (mode === "off") {
    return {
      ...base,
      notReadyReason: "LEMON_SQUEEZY_MODE is off (placeholder provider active).",
    };
  }

  if (mode === "live" && !allowLive) {
    return {
      ...base,
      notReadyReason:
        "LIVE mode blocked — set LEMON_SQUEEZY_ALLOW_LIVE=true only when intentionally going live.",
    };
  }

  if (!apiKey || !storeId || !webhookSecret) {
    return {
      ...base,
      notReadyReason:
        "Missing LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, or LEMON_SQUEEZY_WEBHOOK_SECRET.",
    };
  }

  return { ...base, isReady: true, notReadyReason: null };
}

/** Redacted summary for logs — never includes secrets. */
export function lemonSqueezyConfigPresence(config: LemonSqueezyConfig): {
  mode: LemonSqueezyMode;
  apiKey: "SET" | "UNSET";
  storeId: "SET" | "UNSET";
  webhookSecret: "SET" | "UNSET";
  allowLive: boolean;
  isReady: boolean;
  notReadyReason: string | null;
} {
  return {
    mode: config.mode,
    apiKey: config.apiKey ? "SET" : "UNSET",
    storeId: config.storeId ? "SET" : "UNSET",
    webhookSecret: config.webhookSecret ? "SET" : "UNSET",
    allowLive: config.allowLive,
    isReady: config.isReady,
    notReadyReason: config.notReadyReason,
  };
}

export function assertLemonSqueezyTestSafe(config: LemonSqueezyConfig): void {
  if (config.mode === "live" && !config.allowLive) {
    throw new Error(
      "BLOCKED: Lemon Squeezy LIVE mode is not allowed without LEMON_SQUEEZY_ALLOW_LIVE=true",
    );
  }
}

/** Env key names only (for docs / .env.example). */
export const LEMON_SQUEEZY_ENV_KEYS = [
  "LEMON_SQUEEZY_MODE",
  "LEMON_SQUEEZY_API_KEY",
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_WEBHOOK_SECRET",
  "LEMON_SQUEEZY_ALLOW_LIVE",
  "LEMON_SQUEEZY_API_BASE_URL",
  "LEMON_SQUEEZY_VARIANT_PRO_MONTH",
  "LEMON_SQUEEZY_VARIANT_PRO_YEAR",
  "LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH",
  "LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR",
] as const;
