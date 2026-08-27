/**
 * Idempotent Lemon Squeezy webhook processor.
 * Entitlement updates run only after signature verification (caller).
 * Does NOT grant AI credits from frontend — updates plan of record only.
 */

import {
  decideEntitlement,
  mapLemonSubscriptionStatus,
} from "@/services/billing/lemon-squeezy/entitlement";
import {
  extractCustomData,
  extractEndsAt,
  extractSubscriptionStatus,
  extractVariantId,
  isHandledLemonEvent,
  webhookEventId,
  type LemonWebhookEnvelope,
} from "@/services/billing/lemon-squeezy/events";
import { planFromVariantId } from "@/services/billing/lemon-squeezy/variants";
import type { BillingPlanId } from "@/services/billing/types";

export type WebhookProcessStatus =
  | "processed"
  | "duplicate"
  | "ignored"
  | "error";

export interface WebhookProcessResult {
  status: WebhookProcessStatus;
  eventName: string;
  eventId: string;
  message: string;
  entitlementPlan?: BillingPlanId;
  paidAccessActive?: boolean;
}

export interface WebhookIdempotencyStore {
  has(eventId: string): Promise<boolean>;
  mark(eventId: string, eventName: string): Promise<void>;
}

/** In-memory store for unit tests (process-local). */
export function createMemoryIdempotencyStore(): WebhookIdempotencyStore {
  const seen = new Set<string>();
  return {
    async has(eventId) {
      return seen.has(eventId);
    },
    async mark(eventId) {
      seen.add(eventId);
    },
  };
}

export interface EntitlementWriter {
  /**
   * Persist plan for the authenticated mapping from custom_data.
   * Must ignore client-supplied ids that fail ownership checks when a DB is wired.
   */
  applyPlan(input: {
    userId: string;
    workspaceId: string | null;
    plan: BillingPlanId;
    paidAccessActive: boolean;
    providerCustomerId: string | null;
    providerSubscriptionId: string | null;
    status: string;
  }): Promise<void>;
}

/** No-op writer — used when preparing architecture without mutating DB. */
export const noopEntitlementWriter: EntitlementWriter = {
  async applyPlan() {
    /* intentional no-op for dry-run / unit tests */
  },
};

export async function processLemonSqueezyEvent(opts: {
  payload: LemonWebhookEnvelope;
  idempotency: WebhookIdempotencyStore;
  writer?: EntitlementWriter;
  /** When true, skip writer side effects (architecture dry-run). */
  dryRun?: boolean;
}): Promise<WebhookProcessResult> {
  const eventName = opts.payload.meta?.event_name ?? "";
  const eventId = webhookEventId(opts.payload);

  if (!eventName) {
    return {
      status: "error",
      eventName: "",
      eventId,
      message: "Malformed webhook: missing meta.event_name",
    };
  }

  if (await opts.idempotency.has(eventId)) {
    return {
      status: "duplicate",
      eventName,
      eventId,
      message: "Duplicate webhook ignored (idempotent).",
    };
  }

  if (!isHandledLemonEvent(eventName)) {
    await opts.idempotency.mark(eventId, eventName);
    return {
      status: "ignored",
      eventName,
      eventId,
      message: `Unknown or unhandled event: ${eventName}`,
    };
  }

  const custom = extractCustomData(opts.payload);
  const attributes = opts.payload.data?.attributes;
  const variantId = extractVariantId(attributes);
  const mappedPlan = planFromVariantId(variantId);
  const lemonStatus = mapLemonSubscriptionStatus(
    extractSubscriptionStatus(attributes),
  );

  // Orders: refunds revoke paid access; created alone does not grant plan
  // (subscription events are source of truth for entitlements).
  if (eventName === "order_created") {
    await opts.idempotency.mark(eventId, eventName);
    return {
      status: "processed",
      eventName,
      eventId,
      message:
        "order_created acknowledged — entitlement waits for subscription events.",
    };
  }

  if (eventName === "order_refunded") {
    const decision = decideEntitlement({
      mappedPlan: "free",
      status: "expired",
    });
    if (!opts.dryRun && custom.user_id && opts.writer) {
      await opts.writer.applyPlan({
        userId: custom.user_id,
        workspaceId: custom.workspace_id ?? null,
        plan: decision.plan,
        paidAccessActive: false,
        providerCustomerId: null,
        providerSubscriptionId: opts.payload.data?.id
          ? String(opts.payload.data.id)
          : null,
        status: "expired",
      });
    }
    await opts.idempotency.mark(eventId, eventName);
    return {
      status: "processed",
      eventName,
      eventId,
      message: "order_refunded — paid entitlement closed.",
      entitlementPlan: "free",
      paidAccessActive: false,
    };
  }

  // Force expired/cancelled semantics for specific events
  let status = lemonStatus;
  if (eventName === "subscription_expired") status = "expired";
  if (eventName === "subscription_cancelled") status = "cancelled";
  if (eventName === "subscription_paused") status = "paused";
  if (
    eventName === "subscription_resumed" ||
    eventName === "subscription_unpaused"
  ) {
    status = lemonStatus === "unknown" ? "active" : lemonStatus;
  }

  const decision = decideEntitlement({
    mappedPlan,
    status,
    endsAt: extractEndsAt(attributes),
  });

  if (!custom.user_id) {
    await opts.idempotency.mark(eventId, eventName);
    return {
      status: "error",
      eventName,
      eventId,
      message:
        "Missing custom_data.user_id — checkout must set server-side user mapping.",
      entitlementPlan: decision.plan,
      paidAccessActive: decision.paidAccessActive,
    };
  }

  if (!opts.dryRun && opts.writer) {
    const customerId = attributes?.customer_id;
    await opts.writer.applyPlan({
      userId: custom.user_id,
      workspaceId: custom.workspace_id ?? null,
      plan: decision.plan,
      paidAccessActive: decision.paidAccessActive,
      providerCustomerId:
        typeof customerId === "number" || typeof customerId === "string"
          ? String(customerId)
          : null,
      providerSubscriptionId: opts.payload.data?.id
        ? String(opts.payload.data.id)
        : null,
      status,
    });
  }

  await opts.idempotency.mark(eventId, eventName);

  return {
    status: "processed",
    eventName,
    eventId,
    message: decision.reason,
    entitlementPlan: decision.plan,
    paidAccessActive: decision.paidAccessActive,
  };
}
