/**
 * Lemon Squeezy payment preparation — unit/smoke (no live network checkout).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

import {
  loadLemonSqueezyConfig,
  lemonSqueezyConfigPresence,
  resolveLemonSqueezyMode,
} from "../../services/billing/lemon-squeezy/config";
import {
  decideEntitlement,
  mapLemonSubscriptionStatus,
} from "../../services/billing/lemon-squeezy/entitlement";
import {
  computeLemonSqueezySignature,
  verifyLemonSqueezySignature,
} from "../../services/billing/lemon-squeezy/signature";
import {
  loadVariantMapping,
  planFromVariantId,
  resolveVariantId,
} from "../../services/billing/lemon-squeezy/variants";
import {
  createMemoryIdempotencyStore,
  processLemonSqueezyEvent,
} from "../../services/billing/lemon-squeezy/webhook-processor";
import { resolvePaymentProvider } from "../../services/billing/factory";
import { LemonSqueezyPaymentProvider } from "../../services/billing/providers/lemon-squeezy.provider";

describe("Lemon Squeezy config & safety", () => {
  it("defaults to off / not ready without credentials", () => {
    const config = loadLemonSqueezyConfig({});
    assert.equal(config.mode, "off");
    assert.equal(config.isReady, false);
    const presence = lemonSqueezyConfigPresence(config);
    assert.equal(presence.apiKey, "UNSET");
    assert.equal(presence.webhookSecret, "UNSET");
  });

  it("blocks LIVE without allow flag", () => {
    const config = loadLemonSqueezyConfig({
      LEMON_SQUEEZY_MODE: "live",
      LEMON_SQUEEZY_API_KEY: "test_key",
      LEMON_SQUEEZY_STORE_ID: "1",
      LEMON_SQUEEZY_WEBHOOK_SECRET: "whsec",
      LEMON_SQUEEZY_ALLOW_LIVE: "false",
    });
    assert.equal(config.isReady, false);
    assert.match(config.notReadyReason ?? "", /LIVE mode blocked/i);
  });

  it("is checkout-ready in TEST mode without webhook secret", () => {
    const config = loadLemonSqueezyConfig({
      LEMON_SQUEEZY_MODE: "test",
      LEMON_SQUEEZY_API_KEY: "test_key",
      LEMON_SQUEEZY_STORE_ID: "1",
    });
    assert.equal(resolveLemonSqueezyMode({ LEMON_SQUEEZY_MODE: "test" }), "test");
    assert.equal(config.isReady, true);
    assert.equal(config.isCheckoutReady, true);
    assert.equal(config.isWebhookReady, false);
  });

  it("is ready in TEST mode with complete credentials", () => {
    const config = loadLemonSqueezyConfig({
      LEMON_SQUEEZY_MODE: "test",
      LEMON_SQUEEZY_API_KEY: "test_key",
      LEMON_SQUEEZY_STORE_ID: "1",
      LEMON_SQUEEZY_WEBHOOK_SECRET: "whsec",
    });
    assert.equal(config.isReady, true);
    assert.equal(config.isWebhookReady, true);
  });

  it("factory keeps placeholder when mode off", () => {
    const provider = resolvePaymentProvider({ LEMON_SQUEEZY_MODE: "off" });
    assert.equal(provider.id, "placeholder");
    assert.equal(provider.isConfigured(), false);
  });

  it("factory selects lemonsqueezy in ready test mode without webhook secret", () => {
    const provider = resolvePaymentProvider({
      LEMON_SQUEEZY_MODE: "test",
      LEMON_SQUEEZY_API_KEY: "test_key",
      LEMON_SQUEEZY_STORE_ID: "1",
      LEMON_SQUEEZY_VARIANT_PRO: "111",
    });
    assert.equal(provider.id, "lemonsqueezy");
    assert.equal(provider.isConfigured(), true);
  });
});

describe("Lemon commercial checkout plan mapping", () => {
  it("maps developer/pro/business variants from env", async () => {
    const {
      loadCheckoutVariantMapping,
      resolveCheckoutVariantId,
      entitlementPlanFromCheckoutPlan,
      checkoutPlanFromVariantId,
    } = await import("../../services/billing/lemon-squeezy/checkout-plans");

    const mapping = loadCheckoutVariantMapping({
      LEMON_SQUEEZY_VARIANT_DEVELOPER: "2094197",
      LEMON_SQUEEZY_VARIANT_PRO: "2094199",
      LEMON_SQUEEZY_VARIANT_BUSINESS: "2094201",
    });
    assert.equal(resolveCheckoutVariantId("developer", mapping), "2094197");
    assert.equal(resolveCheckoutVariantId("pro", mapping), "2094199");
    assert.equal(resolveCheckoutVariantId("business", mapping), "2094201");
    assert.equal(entitlementPlanFromCheckoutPlan("developer"), "pro");
    assert.equal(entitlementPlanFromCheckoutPlan("business"), "enterprise");
    assert.equal(checkoutPlanFromVariantId("2094201", mapping), "business");
  });
});

describe("Lemon Squeezy plan → variant mapping", () => {
  const mapping = loadVariantMapping({
    LEMON_SQUEEZY_VARIANT_PRO_MONTH: "101",
    LEMON_SQUEEZY_VARIANT_PRO_YEAR: "102",
    LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH: "201",
    LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR: "202",
  });

  it("resolves paid variants and rejects free", () => {
    assert.equal(resolveVariantId("pro", "month", mapping), "101");
    assert.equal(resolveVariantId("enterprise", "year", mapping), "202");
    assert.equal(resolveVariantId("free", "month", mapping), null);
  });

  it("reverse maps variant to plan", () => {
    assert.equal(planFromVariantId("101", mapping), "pro");
    assert.equal(planFromVariantId("201", mapping), "enterprise");
    assert.equal(planFromVariantId("999", mapping), null);
  });
});

describe("Lemon Squeezy checkout contract", () => {
  it("creates checkout with server user mapping in custom data", async () => {
    let capturedBody: string | null = null;
    const fetchImpl: typeof fetch = async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          data: { attributes: { url: "https://example.test/checkout/abc" } },
        }),
        { status: 200 },
      );
    };

    const provider = new LemonSqueezyPaymentProvider(
      loadLemonSqueezyConfig({
        LEMON_SQUEEZY_MODE: "test",
        LEMON_SQUEEZY_API_KEY: "test_key",
        LEMON_SQUEEZY_STORE_ID: "9",
        LEMON_SQUEEZY_WEBHOOK_SECRET: "whsec",
      }),
      loadVariantMapping({ LEMON_SQUEEZY_VARIANT_PRO_MONTH: "101" }),
      fetchImpl,
    );

    const result = await provider.createCheckoutSession({
      userId: "user-server-1",
      workspaceId: "ws-1",
      email: "buyer@example.com",
      plan: "pro",
      interval: "month",
      successUrl: "http://127.0.0.1:3000/billing?checkout=returned",
      cancelUrl: "http://127.0.0.1:3000/billing?checkout=canceled",
    });

    assert.equal(result.status, "ok");
    assert.equal(result.redirectUrl, "https://example.test/checkout/abc");
    assert.match(result.message, /webhook/i);
    assert.ok(capturedBody);
    assert.match(capturedBody!, /user-server-1/);
    assert.match(capturedBody!, /ws-1/);
    assert.match(capturedBody!, /"101"/);
    assert.match(capturedBody!, /"test_mode":true/);
  });

  it("errors when variant mapping missing", async () => {
    const provider = new LemonSqueezyPaymentProvider(
      loadLemonSqueezyConfig({
        LEMON_SQUEEZY_MODE: "test",
        LEMON_SQUEEZY_API_KEY: "test_key",
        LEMON_SQUEEZY_STORE_ID: "9",
        LEMON_SQUEEZY_WEBHOOK_SECRET: "whsec",
      }),
      loadVariantMapping({}),
    );
    const result = await provider.createCheckoutSession({
      userId: "u1",
      workspaceId: "w1",
      email: "a@b.c",
      plan: "pro",
      interval: "month",
      successUrl: "http://localhost/ok",
      cancelUrl: "http://localhost/cancel",
    });
    assert.equal(result.status, "error");
    assert.equal(result.redirectUrl, null);
  });
});

describe("Lemon Squeezy webhook signature", () => {
  const secret = "test_webhook_secret";
  const body = '{"meta":{"event_name":"subscription_created"}}';

  it("accepts valid signature", () => {
    const sig = computeLemonSqueezySignature(body, secret);
    assert.equal(
      verifyLemonSqueezySignature({
        rawBody: body,
        signatureHeader: sig,
        secret,
      }),
      true,
    );
  });

  it("rejects invalid signature", () => {
    assert.equal(
      verifyLemonSqueezySignature({
        rawBody: body,
        signatureHeader: "deadbeef",
        secret,
      }),
      false,
    );
  });

  it("rejects missing signature / secret", () => {
    assert.equal(
      verifyLemonSqueezySignature({
        rawBody: body,
        signatureHeader: null,
        secret,
      }),
      false,
    );
    assert.equal(
      verifyLemonSqueezySignature({
        rawBody: body,
        signatureHeader: "abc",
        secret: "",
      }),
      false,
    );
  });
});

describe("Lemon Squeezy webhook events & entitlement", () => {
  const mappingEnv = {
    LEMON_SQUEEZY_VARIANT_PRO_MONTH: "101",
  };

  it("maps statuses and expired closes paid access", () => {
    assert.equal(mapLemonSubscriptionStatus("on_trial"), "on_trial");
    const expired = decideEntitlement({
      mappedPlan: "pro",
      status: "expired",
    });
    assert.equal(expired.plan, "free");
    assert.equal(expired.paidAccessActive, false);
  });

  it("cancelled retains access until ends_at", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const d = decideEntitlement({
      mappedPlan: "pro",
      status: "cancelled",
      endsAt: future,
    });
    assert.equal(d.paidAccessActive, true);
    assert.equal(d.plan, "pro");
  });

  it("processes subscription_created with user mapping", async () => {
    process.env.LEMON_SQUEEZY_VARIANT_PRO_MONTH = "101";
    const store = createMemoryIdempotencyStore();
    const applied: Array<{ userId: string; plan: string }> = [];
    const result = await processLemonSqueezyEvent({
      payload: {
        meta: {
          event_name: "subscription_created",
          webhook_id: "evt-1",
          custom_data: { user_id: "user-1", workspace_id: "ws-1" },
        },
        data: {
          id: "sub_1",
          attributes: {
            status: "active",
            variant_id: 101,
            customer_id: 55,
          },
        },
      },
      idempotency: store,
      writer: {
        async applyPlan(input) {
          applied.push({ userId: input.userId, plan: input.plan });
        },
      },
    });
    assert.equal(result.status, "processed");
    assert.equal(result.entitlementPlan, "pro");
    assert.equal(applied[0]?.userId, "user-1");
    assert.equal(applied[0]?.plan, "pro");
    void mappingEnv;
  });

  it("deduplicates webhook delivery", async () => {
    const store = createMemoryIdempotencyStore();
    const payload = {
      meta: {
        event_name: "subscription_cancelled",
        webhook_id: "evt-dup",
        custom_data: { user_id: "user-1" },
      },
      data: {
        id: "sub_1",
        attributes: {
          status: "cancelled",
          variant_id: "101",
          ends_at: new Date(Date.now() - 1000).toISOString(),
        },
      },
    };
    const first = await processLemonSqueezyEvent({
      payload,
      idempotency: store,
      dryRun: true,
    });
    const second = await processLemonSqueezyEvent({
      payload,
      idempotency: store,
      dryRun: true,
    });
    assert.equal(first.status, "processed");
    assert.equal(second.status, "duplicate");
  });

  it("handles subscription_payment_success without granting entitlement", async () => {
    const store = createMemoryIdempotencyStore();
    const result = await processLemonSqueezyEvent({
      payload: {
        meta: {
          event_name: "subscription_payment_success",
          webhook_id: "evt-pay",
          custom_data: { user_id: "user-1" },
        },
        data: { id: "inv_1", attributes: {} },
      },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(result.status, "processed");
    assert.match(result.message, /waits for subscription/i);
  });

  it("handles subscription_expired and order_refunded", async () => {
    const store = createMemoryIdempotencyStore();
    const expired = await processLemonSqueezyEvent({
      payload: {
        meta: {
          event_name: "subscription_expired",
          webhook_id: "evt-exp",
          custom_data: { user_id: "user-1" },
        },
        data: {
          id: "sub_1",
          attributes: { status: "expired", variant_id: "101" },
        },
      },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(expired.entitlementPlan, "free");
    assert.equal(expired.paidAccessActive, false);

    const refunded = await processLemonSqueezyEvent({
      payload: {
        meta: {
          event_name: "order_refunded",
          webhook_id: "evt-ref",
          custom_data: { user_id: "user-1" },
        },
        data: { id: "ord_1", attributes: {} },
      },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(refunded.entitlementPlan, "free");
  });

  it("ignores unknown events and flags malformed", async () => {
    const store = createMemoryIdempotencyStore();
    const unknown = await processLemonSqueezyEvent({
      payload: {
        meta: { event_name: "license_key_created", webhook_id: "x1" },
        data: { id: "1" },
      },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(unknown.status, "ignored");

    const malformed = await processLemonSqueezyEvent({
      payload: { data: { id: "1" } },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(malformed.status, "error");
  });

  it("requires custom_data.user_id for subscription entitlement", async () => {
    const store = createMemoryIdempotencyStore();
    const result = await processLemonSqueezyEvent({
      payload: {
        meta: { event_name: "subscription_updated", webhook_id: "nouid" },
        data: {
          id: "sub",
          attributes: { status: "active", variant_id: "101" },
        },
      },
      idempotency: store,
      dryRun: true,
    });
    assert.equal(result.status, "error");
    assert.match(result.message, /user_id/);
  });
});

describe("Lemon billing_subscriptions sibling deactivation", () => {
  it("A) first active Pro subscription stays alone", async () => {
    const {
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    const rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_pro",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.paid_access_active, true);
    assert.equal(rows[0]?.plan, "pro");
  });

  it("B) Pro → Business deactivates Pro sibling", async () => {
    const {
      SIBLING_SUPERSEDED_STATUS,
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    let rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_pro",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      rows,
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_biz",
        provider_customer_id: "cust_1",
        plan: "enterprise",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );

    const pro = rows.find((r) => r.provider_subscription_id === "sub_pro");
    const biz = rows.find((r) => r.provider_subscription_id === "sub_biz");
    assert.equal(pro?.paid_access_active, false);
    assert.equal(pro?.status, SIBLING_SUPERSEDED_STATUS);
    assert.equal(biz?.paid_access_active, true);
    assert.equal(biz?.status, "active");
    assert.equal(rows.filter((r) => r.paid_access_active).length, 1);
  });

  it("C) Business → Pro deactivates Business sibling", async () => {
    const {
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    let rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_biz",
        provider_customer_id: "cust_1",
        plan: "enterprise",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      rows,
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_pro2",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );

    assert.equal(
      rows.find((r) => r.provider_subscription_id === "sub_biz")
        ?.paid_access_active,
      false,
    );
    assert.equal(
      rows.find((r) => r.provider_subscription_id === "sub_pro2")
        ?.paid_access_active,
      true,
    );
    assert.equal(rows.filter((r) => r.paid_access_active).length, 1);
  });

  it("D/E) duplicate / update same subscription id does not create a second row", async () => {
    const {
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    let rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_1",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      rows,
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_1",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.paid_access_active, true);
  });

  it("F) subscription_plan_changed on same id updates plan without sibling self-kill", async () => {
    const {
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    let rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_1",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      rows,
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_1",
        provider_customer_id: "cust_1",
        plan: "enterprise",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.plan, "enterprise");
    assert.equal(rows[0]?.paid_access_active, true);
  });

  it("G) cancelled/expired does not deactivate other active siblings", async () => {
    const {
      shouldDeactivateSiblingSubscriptions,
      upsertSubscriptionMirrorAndDeactivateSiblings,
    } = await import("../../services/billing/lemon-squeezy/sibling-deactivation");

    assert.equal(
      shouldDeactivateSiblingSubscriptions({
        paidAccessActive: false,
        providerSubscriptionId: "sub_old",
        status: "expired",
      }),
      false,
    );
    assert.equal(
      shouldDeactivateSiblingSubscriptions({
        paidAccessActive: true,
        providerSubscriptionId: "sub_old",
        status: "cancelled",
      }),
      false,
    );
    assert.equal(
      shouldDeactivateSiblingSubscriptions({
        paidAccessActive: true,
        providerSubscriptionId: "sub_old",
        status: "paused",
      }),
      false,
    );

    let rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      [],
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_biz",
        provider_customer_id: "cust_1",
        plan: "enterprise",
        status: "active",
        paid_access_active: true,
      },
      { deactivateSiblings: true },
    );
    // Old Pro expires — must not supersede Business
    rows = upsertSubscriptionMirrorAndDeactivateSiblings(
      rows,
      {
        user_id: "user-a",
        provider: "lemonsqueezy",
        provider_subscription_id: "sub_pro",
        provider_customer_id: "cust_1",
        plan: "pro",
        status: "expired",
        paid_access_active: false,
      },
      { deactivateSiblings: true },
    );
    assert.equal(
      rows.find((r) => r.provider_subscription_id === "sub_biz")
        ?.paid_access_active,
      true,
    );
  });
});

describe("Lemon Squeezy docs & route presence", () => {
  it("ships docs, webhook route, migration proposal, keeps placeholder", () => {
    const docs = readFileSync(
      resolve(process.cwd(), "docs/LEMON_SQUEEZY.md"),
      "utf8",
    );
    const route = readFileSync(
      resolve(process.cwd(), "app/api/webhooks/lemonsqueezy/route.ts"),
      "utf8",
    );
    const placeholder = readFileSync(
      resolve(
        process.cwd(),
        "services/billing/providers/placeholder.provider.ts",
      ),
      "utf8",
    );
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/0018_billing_lemon_squeezy.sql",
      ),
      "utf8",
    );
    const envExample = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );

    assert.match(docs, /TEST MODE/);
    assert.match(docs, /X-Signature|HMAC/);
    assert.match(route, /verifyLemonSqueezySignature/);
    assert.match(route, /x-signature/i);
    assert.match(placeholder, /PlaceholderPaymentProvider/);
    assert.match(migration, /billing_webhook_events/);
    assert.match(envExample, /LEMON_SQUEEZY_MODE/);
    assert.equal(/eyJ|sk_live|sk_test_[A-Za-z0-9]{10,}/.test(docs), false);
  });

  it("billing success redirect does not claim payment complete", () => {
    const service = readFileSync(
      resolve(process.cwd(), "services/billing/billing.service.ts"),
      "utf8",
    );
    assert.match(service, /checkout=returned/);
    assert.equal(/checkout=success/.test(service), false);
  });
});
