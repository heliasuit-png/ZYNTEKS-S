import { createSupabaseAdminClient } from "@/supabase/admin";
import {
  createSupabaseEntitlementWriter,
  createSupabaseWebhookIdempotencyStore,
} from "@/services/billing/lemon-squeezy/entitlement-writer";
import type { LemonWebhookEnvelope } from "@/services/billing/lemon-squeezy/events";
import { verifyLemonSqueezySignature } from "@/services/billing/lemon-squeezy/signature";
import {
  createMemoryIdempotencyStore,
  processLemonSqueezyEvent,
  type WebhookIdempotencyStore,
} from "@/services/billing/lemon-squeezy/webhook-processor";
import { loadLemonSqueezyConfig } from "@/services/billing/lemon-squeezy/config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Process-local fallback when billing_webhook_events is unavailable.
 */
const memoryIdempotency = createMemoryIdempotencyStore();

/**
 * Lemon Squeezy webhooks.
 * - Verifies X-Signature against raw body before any processing.
 * - Does not trust client user ids — uses checkout custom_data set server-side.
 * - Never logs secrets or full payloads with PII beyond event name.
 */
export async function POST(request: NextRequest) {
  const config = loadLemonSqueezyConfig();

  if (!config.webhookSecret) {
    return NextResponse.json(
      { success: false, error: { message: "Webhook not configured." } },
      { status: 503 },
    );
  }

  if (config.mode === "live" && !config.allowLive) {
    return NextResponse.json(
      { success: false, error: { message: "LIVE webhooks blocked." } },
      { status: 403 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (
    !verifyLemonSqueezySignature({
      rawBody,
      signatureHeader: signature,
      secret: config.webhookSecret,
    })
  ) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid signature." } },
      { status: 401 },
    );
  }

  let payload: LemonWebhookEnvelope;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookEnvelope;
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Malformed JSON body." } },
      { status: 400 },
    );
  }

  const eventName = payload.meta?.event_name ?? "unknown";

  // Entitlement writes when checkout is configured (test/live allowed).
  // Frontend checkout redirects must never grant credits/plans.
  // Webhook secret already verified above.
  let writer = undefined;
  let idempotency: WebhookIdempotencyStore = memoryIdempotency;
  if (config.isCheckoutReady) {
    try {
      const admin = createSupabaseAdminClient();
      writer = createSupabaseEntitlementWriter(admin);
      idempotency = createSupabaseWebhookIdempotencyStore(admin);
    } catch {
      writer = undefined;
      idempotency = memoryIdempotency;
    }
  }

  const result = await processLemonSqueezyEvent({
    payload,
    idempotency,
    writer,
    dryRun: !writer,
  });

  // Minimal safe log — no secrets, no custom_data dumps
  console.info(
    JSON.stringify({
      level: "info",
      message: "lemonsqueezy_webhook",
      eventName,
      status: result.status,
    }),
  );

  if (result.status === "error" && result.message.includes("Malformed")) {
    return NextResponse.json(
      { success: false, error: { message: result.message } },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      status: result.status,
      eventName: result.eventName,
    },
  });
}
