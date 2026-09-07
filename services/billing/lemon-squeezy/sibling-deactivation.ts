/**
 * When a new paid Lemon subscription becomes current, older mirror rows for
 * the same user/customer must stop granting paid access.
 *
 * Pure helpers (no DB) — safe for unit tests without server-only.
 */

/** Stored on superseded sibling rows (billing_subscriptions.status is text). */
export const SIBLING_SUPERSEDED_STATUS = "superseded" as const;

/**
 * Statuses that mean "this event is not installing a new winning paid sub".
 * Sibling cleanup must not run for these (would clobber another active plan).
 */
const SIBLING_CLEANUP_BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "expired",
  "paused",
  "unpaid",
  "unknown",
  "superseded",
]);

export function shouldDeactivateSiblingSubscriptions(input: {
  paidAccessActive: boolean;
  providerSubscriptionId: string | null | undefined;
  status: string;
}): boolean {
  if (!input.paidAccessActive) return false;
  if (!input.providerSubscriptionId?.trim()) return false;
  const status = input.status.trim().toLowerCase();
  if (SIBLING_CLEANUP_BLOCKED_STATUSES.has(status)) return false;
  return true;
}

export interface BillingSubscriptionMirrorRow {
  user_id: string;
  provider: string;
  provider_subscription_id: string;
  provider_customer_id: string | null;
  plan: string;
  status: string;
  paid_access_active: boolean;
}

/**
 * In-memory model of the SQL sibling update (for smoke tests).
 * Does not mutate the current subscription id.
 */
export function deactivateSiblingPaidSubscriptionsInMemory(
  rows: BillingSubscriptionMirrorRow[],
  input: {
    userId: string;
    providerSubscriptionId: string;
    providerCustomerId: string | null;
  },
): BillingSubscriptionMirrorRow[] {
  return rows.map((row) => {
    if (row.provider !== "lemonsqueezy") return row;
    if (row.user_id !== input.userId) return row;
    if (row.provider_subscription_id === input.providerSubscriptionId) {
      return row;
    }
    if (input.providerCustomerId) {
      if (row.provider_customer_id !== input.providerCustomerId) return row;
    }
    if (!row.paid_access_active) return row;
    return {
      ...row,
      paid_access_active: false,
      status: SIBLING_SUPERSEDED_STATUS,
    };
  });
}

/**
 * Upsert-like merge by provider + provider_subscription_id, then optional
 * sibling deactivation — mirrors entitlement-writer billing_subscriptions path.
 */
export function upsertSubscriptionMirrorAndDeactivateSiblings(
  rows: BillingSubscriptionMirrorRow[],
  upsert: BillingSubscriptionMirrorRow,
  opts: { deactivateSiblings: boolean },
): BillingSubscriptionMirrorRow[] {
  const without = rows.filter(
    (r) =>
      !(
        r.provider === upsert.provider &&
        r.provider_subscription_id === upsert.provider_subscription_id
      ),
  );
  let next = [...without, upsert];
  if (
    opts.deactivateSiblings &&
    shouldDeactivateSiblingSubscriptions({
      paidAccessActive: upsert.paid_access_active,
      providerSubscriptionId: upsert.provider_subscription_id,
      status: upsert.status,
    })
  ) {
    next = deactivateSiblingPaidSubscriptionsInMemory(next, {
      userId: upsert.user_id,
      providerSubscriptionId: upsert.provider_subscription_id,
      providerCustomerId: upsert.provider_customer_id,
    });
  }
  return next;
}
