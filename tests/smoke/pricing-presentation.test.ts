import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRICING_PRESENTATION_PLANS } from "@/services/billing/pricing-presentation";
import { dictionaries } from "@/lib/i18n/dictionaries";

const root = process.cwd();

describe("pricing presentation (Lemon review, payments off)", () => {
  it("exposes four presentation plans with expected monthly prices", () => {
    assert.deepEqual(
      PRICING_PRESENTATION_PLANS.map((p) => [p.id, p.amountCents]),
      [
        ["free", 0],
        ["developer", 1900],
        ["pro", 4900],
        ["business", 29900],
      ],
    );
    assert.equal(
      PRICING_PRESENTATION_PLANS.find((p) => p.id === "pro")?.highlighted,
      true,
    );
  });

  it("keeps TR/EN plan copy key parity and non-empty feature lists", () => {
    for (const locale of ["en", "tr"] as const) {
      const pricing = dictionaries[locale].landing.pricing;
      assert.ok(pricing.moreFeatures.includes("{count}"));
      assert.ok(pricing.paymentSecureNote.length > 0);
      const plans = pricing.plans;
      for (const id of ["free", "developer", "pro", "business"] as const) {
        const plan = plans[id];
        assert.ok(plan.name.length > 0, `${locale}.${id}.name`);
        assert.ok(plan.description.length > 0, `${locale}.${id}.description`);
        assert.ok(plan.cta.length > 0, `${locale}.${id}.cta`);
        assert.ok(plan.limits.length >= 4, `${locale}.${id}.limits`);
        assert.ok(plan.features.length >= 8, `${locale}.${id}.features`);
      }
    }
  });

  it("paid plans use subscribe CTA kind (no checkout)", () => {
    assert.equal(
      PRICING_PRESENTATION_PLANS.find((p) => p.id === "business")?.ctaKind,
      "subscribe",
    );
  });

  it("marketing pricing cards never call checkout or Lemon", () => {
    const cards = readFileSync(
      join(root, "features/billing/components/marketing-pricing-cards.tsx"),
      "utf8",
    );
    assert.match(cards, /data-checkout="disabled"/);
    assert.doesNotMatch(cards, /purchasePlanAction|upgradePlanAction|createCheckout|lemonsqueezy|lemon-squeezy/i);
    assert.match(cards, /comingSoonTitle/);
  });

  it("pricing page uses presentation cards, not purchase actions", () => {
    const page = readFileSync(
      join(root, "app/(marketing)/pricing/page.tsx"),
      "utf8",
    );
    assert.match(page, /MarketingPricingCards/);
    assert.doesNotMatch(page, /purchasePlanAction|BILLING_CATALOG/);
  });

  it("payment factory remains placeholder (Lemon mode not activated)", () => {
    const factory = readFileSync(
      join(root, "services/billing/factory.ts"),
      "utf8",
    );
    assert.match(factory, /placeholderPaymentProvider/);
    assert.doesNotMatch(factory, /lemonSqueezy|LEMON_SQUEEZY_MODE/);
  });
});
