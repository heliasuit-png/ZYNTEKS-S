/**
 * Lemon Squeezy subscription / entitlement mapping.
 *
 * Paid access is driven ONLY by verified webhook/API state — never by
 * frontend checkout redirects.
 */

import type { BillingPlanId } from "@/services/billing/types";

/** Extended provider statuses used for Lemon Squeezy lifecycle. */
export type LemonSubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired"
  | "unknown";

export interface EntitlementDecision {
  /** Plan to persist locally (profiles / workspaces). */
  plan: BillingPlanId;
  /** Whether paid features (pro/enterprise limits) apply now. */
  paidAccessActive: boolean;
  status: LemonSubscriptionStatus;
  reason: string;
}

/**
 * Map Lemon Squeezy `attributes.status` strings to our model.
 */
export function mapLemonSubscriptionStatus(
  raw: string | null | undefined,
): LemonSubscriptionStatus {
  const s = (raw ?? "").toLowerCase().trim();
  switch (s) {
    case "on_trial":
      return "on_trial";
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

/**
 * Entitlement rules:
 * - active / on_trial / past_due / paused → keep mapped paid plan (access per LS period)
 * - cancelled → keep paid plan until period end (caller supplies endsAt / cancelAtPeriodEnd)
 * - expired / unpaid (hard) → fall back to free
 *
 * AI quota follows plan via existing AI_MONTHLY_MESSAGE_LIMITS — no separate
 * credit grant on checkout success.
 */
export function decideEntitlement(input: {
  mappedPlan: BillingPlanId | null;
  status: LemonSubscriptionStatus;
  /** ISO timestamp when access ends (cancelled subscriptions). */
  endsAt?: string | null;
  now?: Date;
}): EntitlementDecision {
  const now = input.now ?? new Date();
  const plan = input.mappedPlan && input.mappedPlan !== "free"
    ? input.mappedPlan
    : ("free" as BillingPlanId);

  if (!input.mappedPlan || input.mappedPlan === "free") {
    return {
      plan: "free",
      paidAccessActive: false,
      status: input.status,
      reason: "No paid plan mapped from variant.",
    };
  }

  switch (input.status) {
    case "active":
    case "on_trial":
    case "past_due":
    case "paused":
      return {
        plan,
        paidAccessActive: true,
        status: input.status,
        reason: `Status ${input.status} grants paid entitlement.`,
      };
    case "cancelled": {
      const ends = input.endsAt ? new Date(input.endsAt) : null;
      if (ends && !Number.isNaN(ends.getTime()) && ends.getTime() > now.getTime()) {
        return {
          plan,
          paidAccessActive: true,
          status: "cancelled",
          reason:
            "Cancelled but current billing period has not ended — access retained.",
        };
      }
      return {
        plan: "free",
        paidAccessActive: false,
        status: "cancelled",
        reason: "Cancelled and billing period ended — paid access closed.",
      };
    }
    case "expired":
    case "unpaid":
      return {
        plan: "free",
        paidAccessActive: false,
        status: input.status,
        reason: `Status ${input.status} closes paid entitlement.`,
      };
    default:
      return {
        plan: "free",
        paidAccessActive: false,
        status: "unknown",
        reason: "Unknown subscription status — defaulting to free.",
      };
  }
}

/** Map to BillingSubscription.status used by UI types. */
export function toBillingSubscriptionStatus(
  status: LemonSubscriptionStatus,
):
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "none" {
  switch (status) {
    case "on_trial":
      return "trialing";
    case "active":
    case "paused":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
    case "expired":
      return "canceled";
    default:
      return "none";
  }
}
