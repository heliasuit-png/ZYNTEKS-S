/**
 * Staging Lemon Squeezy billing E2E (TEST prep).
 * - Never uses production Supabase / production payments.
 * - Never prints secrets.
 * - If Lemon credentials UNSET → real checkout BLOCKED; still validates
 *   migration, entitlement, idempotency, portal, and signature security
 *   against staging with simulated signed events.
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";

const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const STAGING_SB = "qwylzdzsqjjqdkomezvg.supabase.co";

function load(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

load(".env.staging");
load("env.staging");

const results = {
  "MIGRATION 0018": "BLOCKED",
  CHECKOUT: "BLOCKED",
  "WEBHOOK SIGNATURE": "BLOCKED",
  "WEBHOOK PROCESSING": "BLOCKED",
  "WEBHOOK IDEMPOTENCY": "BLOCKED",
  "PLAN ENTITLEMENT": "BLOCKED",
  "CANCEL/EXPIRE": "BLOCKED",
  "CUSTOMER PORTAL": "BLOCKED",
  "PAYMENT UX": "BLOCKED",
  SECURITY: "BLOCKED",
  CLEANUP: "BLOCKED",
};

function set(k, v) {
  results[k] = v;
}

function presence(k) {
  return process.env[k]?.trim() ? "SET" : "UNSET";
}

const supabaseUrl = (process.env.STAGING_SUPABASE_URL || "").trim();
const anon = (process.env.STAGING_SUPABASE_ANON_KEY || "").trim();
const service = (process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "").trim();
const baseUrl = (process.env.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);

if (!supabaseUrl || !anon || !service) {
  console.log("PRODUCTION SAFETY: FAIL (missing staging supabase)");
  process.exit(2);
}

const sbHost = new URL(supabaseUrl).hostname.toLowerCase();
if (sbHost === PRODUCTION_SB || sbHost !== STAGING_SB) {
  console.log("PRODUCTION SAFETY: FAIL (not staging supabase)");
  process.exit(2);
}

const lemonMode = (process.env.LEMON_SQUEEZY_MODE || "off").toLowerCase();
const allowLive =
  process.env.LEMON_SQUEEZY_ALLOW_LIVE === "true" ||
  process.env.LEMON_SQUEEZY_ALLOW_LIVE === "1";

console.log(
  JSON.stringify({
    stagingSupabaseHost: sbHost,
    stagingBaseHost: new URL(baseUrl).hostname,
    lemonMode,
    allowLive,
    presence: {
      LEMON_SQUEEZY_API_KEY: presence("LEMON_SQUEEZY_API_KEY"),
      LEMON_SQUEEZY_STORE_ID: presence("LEMON_SQUEEZY_STORE_ID"),
      LEMON_SQUEEZY_WEBHOOK_SECRET: presence("LEMON_SQUEEZY_WEBHOOK_SECRET"),
      LEMON_SQUEEZY_VARIANT_FREE: presence("LEMON_SQUEEZY_VARIANT_FREE"),
      LEMON_SQUEEZY_VARIANT_PRO: presence("LEMON_SQUEEZY_VARIANT_PRO"),
      LEMON_SQUEEZY_VARIANT_ENTERPRISE: presence(
        "LEMON_SQUEEZY_VARIANT_ENTERPRISE",
      ),
      LEMON_SQUEEZY_VARIANT_PRO_MONTH: presence(
        "LEMON_SQUEEZY_VARIANT_PRO_MONTH",
      ),
      LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH: presence(
        "LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH",
      ),
      LEMON_SQUEEZY_MODE: lemonMode,
      LEMON_SQUEEZY_ALLOW_LIVE: presence("LEMON_SQUEEZY_ALLOW_LIVE"),
    },
  }),
);

if (allowLive || lemonMode === "live") {
  console.log("PRODUCTION SAFETY: FAIL (live lemon mode not allowed in staging test)");
  process.exit(2);
}

console.log("PRODUCTION SAFETY: PASS");

const lemonReady =
  presence("LEMON_SQUEEZY_API_KEY") === "SET" &&
  presence("LEMON_SQUEEZY_STORE_ID") === "SET" &&
  presence("LEMON_SQUEEZY_WEBHOOK_SECRET") === "SET" &&
  (presence("LEMON_SQUEEZY_VARIANT_PRO_MONTH") === "SET" ||
    presence("LEMON_SQUEEZY_VARIANT_PRO") === "SET") &&
  lemonMode === "test";

const require = createRequire(resolve(process.cwd(), "package.json"));
// Dynamic import compiled TS via tsx when run as node — use relative built paths through tsx
const {
  verifyLemonSqueezySignature,
  computeLemonSqueezySignature,
} = await import("../services/billing/lemon-squeezy/signature.ts");
const { decideEntitlement } = await import(
  "../services/billing/lemon-squeezy/entitlement.ts"
);
const { processLemonSqueezyEvent } = await import(
  "../services/billing/lemon-squeezy/webhook-processor.ts"
);
const { LemonSqueezyPaymentProvider } = await import(
  "../services/billing/providers/lemon-squeezy.provider.ts"
);
const { loadLemonSqueezyConfig } = await import(
  "../services/billing/lemon-squeezy/config.ts"
);
const { loadVariantMapping } = await import(
  "../services/billing/lemon-squeezy/variants.ts"
);
const { AI_MONTHLY_MESSAGE_LIMITS } = await import("../lib/constants.ts");

const admin = createClient(supabaseUrl, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function makeEmail() {
  return `ls-staging-${randomBytes(6).toString("hex")}@example.test`;
}

async function schemaProbe() {
  const tables = [
    "billing_customers",
    "billing_subscriptions",
    "billing_webhook_events",
  ];
  for (const table of tables) {
    const { error } = await admin.from(table).select("*").limit(1);
    if (error) {
      console.log(`SCHEMA_FAIL ${table}: ${error.message.slice(0, 120)}`);
      return false;
    }
  }
  console.log("SCHEMA_PROBE: PASS (billing_* tables readable by service_role)");
  return true;
}

const schemaOk = await schemaProbe();
set("MIGRATION 0018", schemaOk ? "PASS" : "FAIL");

// --- Payment UX structural (no secrets)
{
  const pricing = readFileSync(
    resolve(process.cwd(), "features/billing/components/pricing-cards.tsx"),
    "utf8",
  );
  const billingPage = readFileSync(
    resolve(process.cwd(), "app/(dashboard)/billing/page.tsx"),
    "utf8",
  );
  const service = readFileSync(
    resolve(process.cwd(), "services/billing/billing.service.ts"),
    "utf8",
  );
  const ok =
    pricing.includes('plan.id === "enterprise"') &&
    pricing.includes("/contact") &&
    billingPage.includes("checkoutNotice") &&
    service.includes("checkout=returned") &&
    !service.includes("checkout=success");
  set("PAYMENT UX", ok ? "PASS" : "FAIL");
}

// --- Signature security (local crypto)
{
  const secret = "staging-test-webhook-secret-not-real";
  const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
  const good = computeLemonSqueezySignature(body, secret);
  const valid = verifyLemonSqueezySignature({
    rawBody: body,
    signatureHeader: good,
    secret,
  });
  const invalid = verifyLemonSqueezySignature({
    rawBody: body,
    signatureHeader: "00",
    secret,
  });
  const missing = verifyLemonSqueezySignature({
    rawBody: body,
    signatureHeader: null,
    secret,
  });
  set(
    "WEBHOOK SIGNATURE",
    valid && !invalid && !missing ? "PASS" : "FAIL",
  );
}

// --- Customer portal without subscription id
{
  const provider = new LemonSqueezyPaymentProvider(
    loadLemonSqueezyConfig({
      LEMON_SQUEEZY_MODE: "test",
      LEMON_SQUEEZY_API_KEY: "test",
      LEMON_SQUEEZY_STORE_ID: "1",
      LEMON_SQUEEZY_WEBHOOK_SECRET: "whsec",
    }),
    loadVariantMapping({ LEMON_SQUEEZY_VARIANT_PRO_MONTH: "101" }),
  );
  const portal = await provider.createBillingPortalSession({
    userId: "u",
    workspaceId: "w",
    email: "a@b.c",
    returnUrl: "http://127.0.0.1:3000/billing",
    providerCustomerId: null,
  });
  const portalOk =
    portal.status === "error" &&
    portal.redirectUrl === null &&
    !/https?:\/\/lemonsqueezy\.com\/billing/.test(portal.message);
  set("CUSTOMER PORTAL", portalOk ? "PASS" : "FAIL");
}

// --- Security extras
{
  const guide = readFileSync(
    resolve(process.cwd(), "features/api-keys/components/connection-guide.tsx"),
    "utf8",
  );
  const providerSrc = readFileSync(
    resolve(
      process.cwd(),
      "services/billing/providers/lemon-squeezy.provider.ts",
    ),
    "utf8",
  );
  const envClientSafe =
    !guide.includes("LEMON_SQUEEZY_API_KEY") &&
    !providerSrc.includes("NEXT_PUBLIC_LEMON") &&
    decideEntitlement({ mappedPlan: "pro", status: "expired" }).plan === "free";
  set("SECURITY", envClientSafe && results["WEBHOOK SIGNATURE"] === "PASS" ? "PASS" : "FAIL");
}

if (!lemonReady) {
  console.log(
    "CHECKOUT: BLOCKED — Lemon Squeezy TEST credentials/variants UNSET (will not call live API)",
  );
  set("CHECKOUT", "BLOCKED");
}

let userId = null;
let workspaceId = null;
let cleanupOk = true;

try {
  const email = makeEmail();
  const password = `Tmp-${randomBytes(12).toString("hex")}!aA1`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || "createUser failed");
  }
  userId = created.data.user.id;

  const ws = await admin
    .from("workspaces")
    .insert({
      name: "LS staging disposable",
      slug: `ls-${randomBytes(4).toString("hex")}`,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (ws.error || !ws.data) {
    const existing = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    workspaceId = existing.data?.id ?? null;
    if (!workspaceId) throw new Error(ws.error?.message || "workspace create failed");
  } else {
    workspaceId = ws.data.id;
    await admin.from("workspace_members").upsert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "owner",
      status: "active",
    });
  }

  await admin
    .from("profiles")
    .update({ subscription_plan: "free" })
    .eq("id", userId);
  await admin.from("workspaces").update({ plan: "free" }).eq("id", workspaceId);

  process.env.LEMON_SQUEEZY_VARIANT_PRO_MONTH = "101";
  process.env.LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH = "201";

  const idempotency = {
    async has(eventId) {
      const { data } = await admin
        .from("billing_webhook_events")
        .select("event_id")
        .eq("provider", "lemonsqueezy")
        .eq("event_id", eventId)
        .maybeSingle();
      return Boolean(data?.event_id);
    },
    async mark(eventId, eventName) {
      await admin.from("billing_webhook_events").insert({
        provider: "lemonsqueezy",
        event_id: eventId,
        event_name: eventName,
      });
    },
  };

  const writer = {
    async applyPlan(input) {
      await admin
        .from("profiles")
        .update({ subscription_plan: input.plan })
        .eq("id", input.userId);
      if (input.workspaceId) {
        await admin
          .from("workspaces")
          .update({ plan: input.plan })
          .eq("id", input.workspaceId);
      }
      if (input.providerCustomerId) {
        await admin.from("billing_customers").upsert(
          {
            user_id: input.userId,
            workspace_id: input.workspaceId,
            provider: "lemonsqueezy",
            provider_customer_id: input.providerCustomerId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider,provider_customer_id" },
        );
      }
      if (input.providerSubscriptionId) {
        await admin.from("billing_subscriptions").upsert(
          {
            user_id: input.userId,
            workspace_id: input.workspaceId,
            provider: "lemonsqueezy",
            provider_subscription_id: input.providerSubscriptionId,
            provider_customer_id: input.providerCustomerId,
            plan: input.plan,
            status: input.status,
            paid_access_active: input.paidAccessActive,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider,provider_subscription_id" },
        );
      }
    },
  };

  // subscription_created → pro
  const createdEvt = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_created",
        webhook_id: `stg-${randomBytes(4).toString("hex")}`,
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: `sub_${randomBytes(4).toString("hex")}`,
        attributes: {
          status: "active",
          variant_id: 101,
          customer_id: 9001,
        },
      },
    },
    idempotency,
    writer,
  });

  const profile = await admin
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();
  const workspace = await admin
    .from("workspaces")
    .select("plan")
    .eq("id", workspaceId)
    .single();

  const proOk =
    createdEvt.status === "processed" &&
    profile.data?.subscription_plan === "pro" &&
    workspace.data?.plan === "pro" &&
    AI_MONTHLY_MESSAGE_LIMITS.pro === null;

  set("WEBHOOK PROCESSING", proOk ? "PASS" : "FAIL");
  set("PLAN ENTITLEMENT", proOk ? "PASS" : "FAIL");
  if (!proOk) {
    console.log(
      `ENTITLEMENT_DETAIL status=${createdEvt.status} plan=${profile.data?.subscription_plan} ws=${workspace.data?.plan}`,
    );
  }

  // Idempotency: replay same webhook_id
  const dup = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_created",
        webhook_id: createdEvt.eventId.replace(/^ls:/, ""),
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_should_not_double",
        attributes: { status: "active", variant_id: 101, customer_id: 9001 },
      },
    },
    idempotency,
    writer,
  });
  // eventId format is ls:${webhook_id} — re-use exact eventId via mark store
  const dupExact = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_updated",
        webhook_id: "dup-exact-1",
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_x",
        attributes: { status: "active", variant_id: 101 },
      },
    },
    idempotency,
    writer,
  });
  const dupExact2 = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_updated",
        webhook_id: "dup-exact-1",
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_x",
        attributes: { status: "active", variant_id: 101 },
      },
    },
    idempotency,
    writer,
  });
  set(
    "WEBHOOK IDEMPOTENCY",
    dupExact.status === "processed" && dupExact2.status === "duplicate"
      ? "PASS"
      : "FAIL",
  );
  void dup;

  // Cancel (period ended) + expire
  const cancelled = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_cancelled",
        webhook_id: `cancel-${randomBytes(3).toString("hex")}`,
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_cancel",
        attributes: {
          status: "cancelled",
          variant_id: 101,
          ends_at: new Date(Date.now() - 1000).toISOString(),
        },
      },
    },
    idempotency,
    writer,
  });

  // Restore pro then expire
  await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_updated",
        webhook_id: `restore-${randomBytes(3).toString("hex")}`,
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_restore",
        attributes: { status: "active", variant_id: 101 },
      },
    },
    idempotency,
    writer,
  });

  const expired = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_expired",
        webhook_id: `exp-${randomBytes(3).toString("hex")}`,
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_exp",
        attributes: { status: "expired", variant_id: 101 },
      },
    },
    idempotency,
    writer,
  });

  const after = await admin
    .from("profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  set(
    "CANCEL/EXPIRE",
    cancelled.entitlementPlan === "free" &&
      expired.entitlementPlan === "free" &&
      after.data?.subscription_plan === "free"
      ? "PASS"
      : "FAIL",
  );

  // Client cannot spoof: processor requires custom_data from checkout mapping;
  // arbitrary foreign user_id without server checkout is still "trusted" only if
  // webhook is signed — document that HTTP layer must verify signature first.
  // Unknown variant → free entitlement
  const unknownVariant = await processLemonSqueezyEvent({
    payload: {
      meta: {
        event_name: "subscription_created",
        webhook_id: `unk-${randomBytes(3).toString("hex")}`,
        custom_data: { user_id: userId, workspace_id: workspaceId },
      },
      data: {
        id: "sub_unk",
        attributes: { status: "active", variant_id: 999999 },
      },
    },
    idempotency,
    writer,
  });
  if (unknownVariant.entitlementPlan !== "free") {
    set("SECURITY", "FAIL");
  }

  // Real Lemon checkout attempt only if credentials ready
  if (lemonReady) {
    const config = loadLemonSqueezyConfig(process.env);
    const provider = new LemonSqueezyPaymentProvider(config);
    const checkout = await provider.createCheckoutSession({
      userId,
      workspaceId,
      email,
      plan: "pro",
      interval: "month",
      successUrl: `${baseUrl}/billing?checkout=returned`,
      cancelUrl: `${baseUrl}/billing?checkout=canceled`,
    });
    set(
      "CHECKOUT",
      checkout.status === "ok" && Boolean(checkout.redirectUrl)
        ? "PASS"
        : "FAIL",
    );
    console.log(
      `CHECKOUT_STATUS=${checkout.status} HAS_URL=${Boolean(checkout.redirectUrl)}`,
    );
  }
} catch (e) {
  console.log(
    "STAGING_HARNESS_ERROR:",
    e instanceof Error ? e.message.slice(0, 240) : "unknown",
  );
  if (results["WEBHOOK PROCESSING"] === "BLOCKED") {
    set("WEBHOOK PROCESSING", "FAIL");
  }
  if (results["PLAN ENTITLEMENT"] === "BLOCKED") {
    set("PLAN ENTITLEMENT", "FAIL");
  }
} finally {
  try {
    if (userId) {
      await admin.from("billing_subscriptions").delete().eq("user_id", userId);
      await admin.from("billing_customers").delete().eq("user_id", userId);
      // Leave webhook ledger rows (idempotent, no PII); disposable user rows removed.
      if (workspaceId) {
        await admin.from("workspace_members").delete().eq("workspace_id", workspaceId);
        await admin.from("workspaces").delete().eq("id", workspaceId);
      }
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
    set("CLEANUP", "PASS");
  } catch (e) {
    cleanupOk = false;
    set("CLEANUP", "FAIL");
    console.log(
      "CLEANUP_FAIL:",
      e instanceof Error ? e.message.slice(0, 160) : "unknown",
    );
  }
}

console.log("---STAGING_LEMON_REPORT---");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v}`);
}
const counts = {
  PASS: Object.values(results).filter((s) => s === "PASS").length,
  FAIL: Object.values(results).filter((s) => s === "FAIL").length,
  BLOCKED: Object.values(results).filter((s) => s === "BLOCKED").length,
};
console.log(JSON.stringify(counts));
process.exit(counts.FAIL > 0 ? 1 : 0);
