/**
 * Payment provider factory.
 *
 * ========================================================================
 * INTEGRATION POINT — swap the placeholder for your provider here.
 * ========================================================================
 *
 * Example (do NOT commit real SDKs in this sold source unless intended):
 *
 *   import { StripePaymentProvider } from "./providers/stripe.provider";
 *   export function getPaymentProvider(): PaymentProvider {
 *     return new StripePaymentProvider();
 *   }
 *
 * Keep secrets in env vars only (e.g. STRIPE_SECRET_KEY).
 * Never hardcode API keys in this repository.
 * ========================================================================
 */

import type { PaymentProvider } from "@/services/billing/provider";
import { placeholderPaymentProvider } from "@/services/billing/providers/placeholder.provider";

let cached: PaymentProvider | null = null;

/** Returns the active payment provider (singleton). */
export function getPaymentProvider(): PaymentProvider {
  if (!cached) {
    // >>> Replace placeholderPaymentProvider with your implementation. <<<
    cached = placeholderPaymentProvider;
  }
  return cached;
}

/** Test helper — reset cached provider (not used in production UI). */
export function resetPaymentProviderCache(): void {
  cached = null;
}
