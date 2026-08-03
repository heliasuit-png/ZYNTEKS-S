/**
 * PaymentProvider abstraction.
 *
 * ========================================================================
 * HOW TO CONNECT A REAL PAYMENT PROVIDER (future owner)
 * ========================================================================
 *
 * 1. Create a new file, e.g. `services/billing/providers/stripe.provider.ts`
 *    that implements `PaymentProvider` below.
 * 2. Read secrets ONLY from environment variables (never hardcode keys).
 * 3. Register it in `services/billing/factory.ts` instead of the placeholder.
 * 4. Optionally add webhook handlers under `app/api/billing/webhooks/` —
 *    webhooks are intentionally NOT shipped in this codebase.
 *
 * The rest of the app (BillingService, UI, plan limits) must not import
 * Stripe / Lemon Squeezy / Paddle SDKs directly.
 * ========================================================================
 */

import type {
  BillingActionResult,
  BillingInvoice,
  BillingSubscription,
  ChangePlanInput,
  CheckoutInput,
  PortalInput,
} from "@/services/billing/types";

export interface PaymentProvider {
  /** Stable machine id, e.g. "placeholder" | "stripe" | "lemonsqueezy". */
  readonly id: string;

  /** Human-readable name shown in Billing settings. */
  readonly displayName: string;

  /**
   * Returns true when required env vars / credentials for this provider exist.
   * The placeholder always returns false.
   */
  isConfigured(): boolean;

  /**
   * Start a hosted checkout for a new purchase or upgrade.
   * Real providers return `{ status: "ok", redirectUrl }`.
   */
  createCheckoutSession(input: CheckoutInput): Promise<BillingActionResult>;

  /**
   * Open the customer billing portal (payment method, cancel, invoices).
   */
  createBillingPortalSession(input: PortalInput): Promise<BillingActionResult>;

  /**
   * Upgrade or downgrade an existing subscription.
   */
  changePlan(input: ChangePlanInput): Promise<BillingActionResult>;

  /**
   * List invoices for a provider customer. Empty array when not configured.
   */
  listInvoices(providerCustomerId: string | null): Promise<BillingInvoice[]>;

  /**
   * Fetch live subscription state from the provider.
   * Returns null when the customer has no provider subscription.
   */
  getSubscription(
    providerCustomerId: string | null,
  ): Promise<BillingSubscription | null>;
}
