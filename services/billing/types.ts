/**
 * Billing domain types.
 *
 * Payment credentials never live here. A future owner wires a real
 * PaymentProvider (see `provider.ts`) — UI and BillingService stay unchanged.
 */

import type { SubscriptionPlan } from "@/types/database";

export type BillingPlanId = SubscriptionPlan;

export type BillingInterval = "month" | "year";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none";

export type InvoiceStatus = "paid" | "open" | "void" | "draft";

/**
 * Result returned by checkout / portal / plan-change actions.
 * When `status` is `not_configured`, the UI shows an integration placeholder.
 */
export type BillingActionStatus =
  | "ok"
  | "not_configured"
  | "error"
  | "unsupported";

export interface BillingActionResult {
  status: BillingActionStatus;
  /**
   * Human-readable message for the UI (integration placeholder or error).
   */
  message: string;
  /**
   * When a real provider is wired, this is the hosted checkout/portal URL.
   * Always `null` for the placeholder provider.
   */
  redirectUrl: string | null;
  /**
   * Provider that produced the result (e.g. "placeholder", "stripe").
   */
  providerId: string;
}

export interface PlanPrice {
  interval: BillingInterval;
  /** Display amount in minor units (cents). Not charged until a provider is wired. */
  amountCents: number;
  currency: string;
}

export interface PlanFeature {
  id: string;
  label: string;
  included: boolean;
  /** Optional highlight value shown in comparison tables. */
  value?: string;
}

export interface PlanDefinition {
  id: BillingPlanId;
  name: string;
  description: string;
  highlighted: boolean;
  prices: PlanPrice[];
  limits: {
    projects: number;
    apiKeysPerProject: number;
    /** `null` = unlimited */
    aiMessagesPerMonth: number | null;
    seats: number | null;
  };
  features: PlanFeature[];
  cta: "purchase" | "upgrade" | "contact" | "current";
}

export interface BillingInvoice {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  /** Hosted invoice PDF/URL from the provider, when available. */
  hostedUrl: string | null;
}

export interface BillingUsageSnapshot {
  projects: number;
  projectLimit: number;
  apiKeys: number;
  apiKeysPerProject: number;
  members: number;
  memberLimit: number | null;
  aiMessages30d: number;
  aiMessageLimit: number | null;
}

export interface BillingSubscription {
  plan: BillingPlanId;
  status: SubscriptionStatus;
  seats: number;
  amountDueCents: number;
  currency: string;
  interval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /**
   * Opaque customer id from the payment provider.
   * Empty until a real PaymentProvider is connected.
   */
  providerCustomerId: string | null;
  /**
   * Opaque subscription id from the payment provider.
   */
  providerSubscriptionId: string | null;
}

export interface BillingOverview {
  subscription: BillingSubscription;
  usage: BillingUsageSnapshot;
  invoices: BillingInvoice[];
  /**
   * Whether the active PaymentProvider reports itself as configured.
   * UI uses this to show integration-ready vs placeholder states.
   */
  providerConfigured: boolean;
  providerId: string;
  providerDisplayName: string;
}

export interface CheckoutInput {
  userId: string;
  workspaceId: string;
  email: string;
  plan: BillingPlanId;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalInput {
  userId: string;
  workspaceId: string;
  email: string;
  returnUrl: string;
  providerCustomerId: string | null;
}

export interface ChangePlanInput {
  userId: string;
  workspaceId: string;
  email: string;
  fromPlan: BillingPlanId;
  toPlan: BillingPlanId;
  interval: BillingInterval;
  providerSubscriptionId: string | null;
}
