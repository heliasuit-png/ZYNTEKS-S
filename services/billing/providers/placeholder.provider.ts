/**
 * Placeholder PaymentProvider.
 *
 * This is the ONLY payment implementation shipped with the SaaS source.
 * It never talks to external networks and never reads payment credentials.
 *
 * Replace this by implementing `PaymentProvider` and registering it in
 * `services/billing/factory.ts`.
 */

import type { PaymentProvider } from "@/services/billing/provider";
import type {
  BillingActionResult,
  BillingInvoice,
  BillingSubscription,
  ChangePlanInput,
  CheckoutInput,
  PortalInput,
} from "@/services/billing/types";

const PROVIDER_ID = "placeholder";
const PROVIDER_NAME = "Payment provider (not connected)";

function notConfigured(
  action: string,
  detail?: string,
): BillingActionResult {
  return {
    status: "not_configured",
    providerId: PROVIDER_ID,
    redirectUrl: null,
    message:
      detail ??
      `${action} requires a payment provider integration. Implement PaymentProvider in services/billing/providers/ and register it in factory.ts.`,
  };
}

export class PlaceholderPaymentProvider implements PaymentProvider {
  readonly id = PROVIDER_ID;
  readonly displayName = PROVIDER_NAME;

  isConfigured(): boolean {
    return false;
  }

  async createCheckoutSession(_input: CheckoutInput): Promise<BillingActionResult> {
    return notConfigured(
      "Checkout / Purchase",
      "Purchase and Upgrade are ready in the UI. Connect a PaymentProvider to open hosted checkout.",
    );
  }

  async createBillingPortalSession(
    _input: PortalInput,
  ): Promise<BillingActionResult> {
    return notConfigured(
      "Manage Subscription",
      "Manage Subscription is ready in the UI. Connect a PaymentProvider to open the customer portal.",
    );
  }

  async changePlan(input: ChangePlanInput): Promise<BillingActionResult> {
    const direction =
      planRank(input.toPlan) > planRank(input.fromPlan) ? "Upgrade" : "Downgrade";
    return notConfigured(
      "Change Plan",
      `${direction} from ${input.fromPlan} to ${input.toPlan} is ready in the UI. Connect a PaymentProvider to apply plan changes.`,
    );
  }

  async listInvoices(
    _providerCustomerId: string | null,
  ): Promise<BillingInvoice[]> {
    // Future provider: return invoices from the payment API.
    return [];
  }

  async getSubscription(
    _providerCustomerId: string | null,
  ): Promise<BillingSubscription | null> {
    // Future provider: sync live subscription state here.
    return null;
  }
}

function planRank(plan: string): number {
  if (plan === "enterprise") return 3;
  if (plan === "pro") return 2;
  return 1;
}

export const placeholderPaymentProvider = new PlaceholderPaymentProvider();
