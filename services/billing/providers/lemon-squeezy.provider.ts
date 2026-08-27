/**
 * LemonSqueezyPaymentProvider — PaymentProvider implementation.
 * Selected by factory only when TEST (or explicitly allowed LIVE) config is ready.
 * Placeholder remains the default when mode=off or incomplete.
 */

import {
  assertLemonSqueezyTestSafe,
  loadLemonSqueezyConfig,
  type LemonSqueezyConfig,
} from "@/services/billing/lemon-squeezy/config";
import {
  createLemonCheckout,
  fetchLemonCustomerPortalUrl,
} from "@/services/billing/lemon-squeezy/api";
import {
  loadVariantMapping,
  requireVariantId,
  type VariantMapping,
} from "@/services/billing/lemon-squeezy/variants";
import type { PaymentProvider } from "@/services/billing/provider";
import type {
  BillingActionResult,
  BillingInvoice,
  BillingSubscription,
  ChangePlanInput,
  CheckoutInput,
  PortalInput,
} from "@/services/billing/types";

export class LemonSqueezyPaymentProvider implements PaymentProvider {
  readonly id = "lemonsqueezy";
  readonly displayName = "Lemon Squeezy";

  constructor(
    private readonly config: LemonSqueezyConfig = loadLemonSqueezyConfig(),
    private readonly variants: VariantMapping = loadVariantMapping(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  isConfigured(): boolean {
    try {
      assertLemonSqueezyTestSafe(this.config);
    } catch {
      return false;
    }
    return this.config.isReady;
  }

  async createCheckoutSession(input: CheckoutInput): Promise<BillingActionResult> {
    if (!this.isConfigured()) {
      return {
        status: "not_configured",
        providerId: this.id,
        redirectUrl: null,
        message:
          this.config.notReadyReason ??
          "Lemon Squeezy is not configured for checkout.",
      };
    }

    if (input.plan === "free") {
      return {
        status: "unsupported",
        providerId: this.id,
        redirectUrl: null,
        message: "Free plan does not require Lemon Squeezy checkout.",
      };
    }

    let variantId: string;
    try {
      variantId = requireVariantId(input.plan, input.interval, this.variants);
    } catch (error) {
      return {
        status: "error",
        providerId: this.id,
        redirectUrl: null,
        message:
          error instanceof Error
            ? error.message
            : "Missing Lemon Squeezy variant mapping.",
      };
    }

    const result = await createLemonCheckout({
      config: this.config,
      variantId,
      input,
      fetchImpl: this.fetchImpl,
    });

    if (!result.ok || !result.checkoutUrl) {
      return {
        status: "error",
        providerId: this.id,
        redirectUrl: null,
        message: result.message,
      };
    }

    return {
      status: "ok",
      providerId: this.id,
      redirectUrl: result.checkoutUrl,
      message:
        "Redirecting to Lemon Squeezy checkout. Entitlement activates only after a verified webhook.",
    };
  }

  async createBillingPortalSession(
    input: PortalInput,
  ): Promise<BillingActionResult> {
    if (!this.isConfigured()) {
      return {
        status: "not_configured",
        providerId: this.id,
        redirectUrl: null,
        message:
          this.config.notReadyReason ??
          "Lemon Squeezy is not configured for customer portal.",
      };
    }

    // Portal URL must come from Lemon Squeezy — we need a subscription id.
    // providerCustomerId field is reused to pass subscription id when available.
    const subscriptionId = input.providerCustomerId;
    if (!subscriptionId) {
      return {
        status: "error",
        providerId: this.id,
        redirectUrl: null,
        message:
          "No Lemon Squeezy subscription id on file. Complete checkout first; portal URL comes from Lemon Squeezy.",
      };
    }

    const portal = await fetchLemonCustomerPortalUrl({
      config: this.config,
      subscriptionId,
      fetchImpl: this.fetchImpl,
    });

    if (!portal.ok || !portal.url) {
      return {
        status: "error",
        providerId: this.id,
        redirectUrl: null,
        message: portal.message,
      };
    }

    return {
      status: "ok",
      providerId: this.id,
      redirectUrl: portal.url,
      message: "Opening Lemon Squeezy customer portal.",
    };
  }

  async changePlan(input: ChangePlanInput): Promise<BillingActionResult> {
    // Plan changes for existing subs are applied via Lemon Squeezy portal /
    // subscription_plan_changed webhook — avoid client-side entitlement.
    if (!this.isConfigured()) {
      return {
        status: "not_configured",
        providerId: this.id,
        redirectUrl: null,
        message: this.config.notReadyReason ?? "Lemon Squeezy not configured.",
      };
    }

    if (input.toPlan === "free") {
      return {
        status: "unsupported",
        providerId: this.id,
        redirectUrl: null,
        message:
          "Cancel or change plans in the Lemon Squeezy customer portal. Local entitlement updates via webhook.",
      };
    }

    if (!input.providerSubscriptionId) {
      return {
        status: "unsupported",
        providerId: this.id,
        redirectUrl: null,
        message:
          "No active Lemon Squeezy subscription. Use Purchase/Upgrade checkout; entitlement syncs via webhook.",
      };
    }

    return {
      status: "unsupported",
      providerId: this.id,
      redirectUrl: null,
      message:
        "Change plan via Lemon Squeezy customer portal. Entitlement syncs on subscription_plan_changed webhook.",
    };
  }

  async listInvoices(
    _providerCustomerId: string | null,
  ): Promise<BillingInvoice[]> {
    return [];
  }

  async getSubscription(
    _providerCustomerId: string | null,
  ): Promise<BillingSubscription | null> {
    return null;
  }
}

export function createLemonSqueezyPaymentProvider(
  config?: LemonSqueezyConfig,
  variants?: VariantMapping,
  fetchImpl?: typeof fetch,
): LemonSqueezyPaymentProvider {
  return new LemonSqueezyPaymentProvider(config, variants, fetchImpl);
}
