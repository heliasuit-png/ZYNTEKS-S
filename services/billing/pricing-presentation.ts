/**
 * Marketing / Lemon review pricing presentation only.
 * Not wired to checkout, entitlements, or PaymentProvider.
 * Runtime subscription plans remain free | pro | enterprise.
 */

export type PricingPresentationPlanId =
  | "free"
  | "developer"
  | "pro"
  | "business";

export interface PricingPresentationPlan {
  id: PricingPresentationPlanId;
  /** Monthly display amount in minor units (cents). Not charged. */
  amountCents: number;
  currency: "USD";
  highlighted: boolean;
  /** Free starts registration; paid plans show coming-soon notice. */
  ctaKind: "start_free" | "subscribe";
}

export const PRICING_PRESENTATION_PLANS: readonly PricingPresentationPlan[] = [
  {
    id: "free",
    amountCents: 0,
    currency: "USD",
    highlighted: false,
    ctaKind: "start_free",
  },
  {
    id: "developer",
    amountCents: 1900,
    currency: "USD",
    highlighted: false,
    ctaKind: "subscribe",
  },
  {
    id: "pro",
    amountCents: 4900,
    currency: "USD",
    highlighted: true,
    ctaKind: "subscribe",
  },
  {
    id: "business",
    amountCents: 29900,
    currency: "USD",
    highlighted: false,
    ctaKind: "subscribe",
  },
] as const;
