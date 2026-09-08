export type LemonSqueezyMode = "off" | "test" | "live";

export interface LemonSqueezyConfig {
  mode: LemonSqueezyMode;
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  allowLive: boolean;
  apiBaseUrl: string;
  /**
   * Checkout may run without webhook secret (secret is added later).
   * True when mode is allowed and API key + store id are present.
   */
  isCheckoutReady: boolean;
  /** Webhook signature verification available. */
  isWebhookReady: boolean;
  /**
   * Provider ready for checkout sessions.
   * Alias of isCheckoutReady (webhook secret is NOT required).
   */
  isReady: boolean;
  /** Human-readable reason when checkout is not ready. */
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
    isCheckoutReady: false,
    isWebhookReady: Boolean(webhookSecret),
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

  if (!apiKey || !storeId) {
    return {
      ...base,
      notReadyReason:
        "Missing LEMON_SQUEEZY_API_KEY or LEMON_SQUEEZY_STORE_ID.",
    };
  }

  return {
    ...base,
    isCheckoutReady: true,
    isReady: true,
    notReadyReason: null,
  };
}

/**
 * Billing / pricing CTAs may open checkout when Lemon is checkout-ready.
 * Ready means mode is test, or live with LEMON_SQUEEZY_ALLOW_LIVE + credentials
 * (see loadLemonSqueezyConfig). MODE=off keeps Coming Soon UI.
 * API route still enforces its own live/auth/variant gates separately.
 */
export function isLemonCheckoutUiEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const config = loadLemonSqueezyConfig(env);
  // isCheckoutReady already false for off, live-without-ALLOW_LIVE, or missing creds.
  if (!config.isCheckoutReady) return false;
  const explicit = (env.LEMON_SQUEEZY_CHECKOUT_UI ?? "").trim().toLowerCase();
  if (explicit === "false" || explicit === "0" || explicit === "off") {
    return false;
  }
  // Default: enable UI when checkout is ready (test or allowed live).
  // Set LEMON_SQUEEZY_CHECKOUT_UI=false to keep Coming Soon while testing API.
  return true;
}

/** Redacted summary for logs — never includes secrets. */
export function lemonSqueezyConfigPresence(config: LemonSqueezyConfig): {
  mode: LemonSqueezyMode;
  apiKey: "SET" | "UNSET";
  storeId: "SET" | "UNSET";
  webhookSecret: "SET" | "UNSET";
  allowLive: boolean;
  isCheckoutReady: boolean;
  isWebhookReady: boolean;
  isReady: boolean;
  notReadyReason: string | null;
} {
  return {
    mode: config.mode,
    apiKey: config.apiKey ? "SET" : "UNSET",
    storeId: config.storeId ? "SET" : "UNSET",
    webhookSecret: config.webhookSecret ? "SET" : "UNSET",
    allowLive: config.allowLive,
    isCheckoutReady: config.isCheckoutReady,
    isWebhookReady: config.isWebhookReady,
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

/** Env key names only (for docs / .env.example). Never values. */
export const LEMON_SQUEEZY_ENV_KEYS = [
  "LEMON_SQUEEZY_MODE",
  "LEMON_SQUEEZY_API_KEY",
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_WEBHOOK_SECRET",
  "LEMON_SQUEEZY_ALLOW_LIVE",
  "LEMON_SQUEEZY_CHECKOUT_UI",
  "LEMON_SQUEEZY_API_BASE_URL",
  "LEMON_SQUEEZY_VARIANT_DEVELOPER",
  "LEMON_SQUEEZY_VARIANT_PRO",
  "LEMON_SQUEEZY_VARIANT_BUSINESS",
  "LEMON_SQUEEZY_VARIANT_PRO_MONTH",
  "LEMON_SQUEEZY_VARIANT_PRO_YEAR",
  "LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH",
  "LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR",
] as const;
