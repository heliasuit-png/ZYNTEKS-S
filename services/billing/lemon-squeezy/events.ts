/**
 * Lemon Squeezy webhook event names we handle.
 */

export const LEMON_SQUEEZY_SUBSCRIPTION_EVENTS = [
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_plan_changed",
] as const;

export const LEMON_SQUEEZY_ORDER_EVENTS = [
  "order_created",
  "order_refunded",
] as const;

export type LemonSqueezySubscriptionEvent =
  (typeof LEMON_SQUEEZY_SUBSCRIPTION_EVENTS)[number];
export type LemonSqueezyOrderEvent =
  (typeof LEMON_SQUEEZY_ORDER_EVENTS)[number];
export type LemonSqueezyHandledEvent =
  | LemonSqueezySubscriptionEvent
  | LemonSqueezyOrderEvent;

export function isHandledLemonEvent(
  name: string,
): name is LemonSqueezyHandledEvent {
  return (
    (LEMON_SQUEEZY_SUBSCRIPTION_EVENTS as readonly string[]).includes(name) ||
    (LEMON_SQUEEZY_ORDER_EVENTS as readonly string[]).includes(name)
  );
}

export interface LemonWebhookCustomData {
  user_id?: string;
  workspace_id?: string;
}

export interface LemonWebhookEnvelope {
  meta?: {
    event_name?: string;
    /** Lemon may send webhook_id for idempotency */
    webhook_id?: string | number;
    custom_data?: LemonWebhookCustomData;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
  };
}

export function extractCustomData(
  payload: LemonWebhookEnvelope,
): LemonWebhookCustomData {
  const raw = payload.meta?.custom_data ?? {};
  return {
    user_id:
      typeof raw.user_id === "string" ? raw.user_id : undefined,
    workspace_id:
      typeof raw.workspace_id === "string" ? raw.workspace_id : undefined,
  };
}

export function extractVariantId(
  attributes: Record<string, unknown> | undefined,
): string | null {
  if (!attributes) return null;
  const variantId = attributes.variant_id;
  if (typeof variantId === "number") return String(variantId);
  if (typeof variantId === "string" && variantId.trim()) return variantId.trim();
  return null;
}

export function extractSubscriptionStatus(
  attributes: Record<string, unknown> | undefined,
): string | null {
  const status = attributes?.status;
  return typeof status === "string" ? status : null;
}

export function extractEndsAt(
  attributes: Record<string, unknown> | undefined,
): string | null {
  const ends =
    attributes?.ends_at ?? attributes?.renews_at ?? attributes?.trial_ends_at;
  return typeof ends === "string" ? ends : null;
}

export function webhookEventId(payload: LemonWebhookEnvelope): string {
  const webhookId = payload.meta?.webhook_id;
  const event = payload.meta?.event_name ?? "unknown";
  const dataId = payload.data?.id ?? "none";
  if (webhookId !== undefined && webhookId !== null) {
    return `ls:${webhookId}`;
  }
  // Fallback deterministic id when webhook_id missing
  const updated = payload.data?.attributes?.updated_at;
  return `ls:${event}:${dataId}:${typeof updated === "string" ? updated : "na"}`;
}
