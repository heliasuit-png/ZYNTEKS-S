/**
 * Payment provider factory.
 *
 * Default MODE=off → PlaceholderPaymentProvider (Coming Soon / no live charge).
 * MODE=test with API key + store → LemonSqueezyPaymentProvider.
 * MODE=live requires LEMON_SQUEEZY_ALLOW_LIVE=true.
 */

import type { PaymentProvider } from "@/services/billing/provider";
import { loadLemonSqueezyConfig } from "@/services/billing/lemon-squeezy/config";
import { createLemonSqueezyPaymentProvider } from "@/services/billing/providers/lemon-squeezy.provider";
import { placeholderPaymentProvider } from "@/services/billing/providers/placeholder.provider";

let cached: PaymentProvider | null = null;

/**
 * Resolve provider from env without caching (tests).
 * Never reads API key values into logs.
 */
export function resolvePaymentProvider(
  env: Record<string, string | undefined> = process.env,
): PaymentProvider {
  const config = loadLemonSqueezyConfig(env);
  if (config.isCheckoutReady) {
    return createLemonSqueezyPaymentProvider(config);
  }
  return placeholderPaymentProvider;
}

/** Returns the active payment provider (singleton). */
export function getPaymentProvider(): PaymentProvider {
  if (!cached) {
    cached = resolvePaymentProvider();
  }
  return cached;
}

/** Test helper — reset cached provider. */
export function resetPaymentProviderCache(): void {
  cached = null;
}
