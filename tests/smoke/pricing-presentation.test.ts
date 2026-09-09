import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRICING_PRESENTATION_PLANS } from "@/services/billing/pricing-presentation";
import { dictionaries } from "@/lib/i18n/dictionaries";
import {
  AI_MONTHLY_MESSAGE_LIMITS,
  PLAN_LIMITS,
} from "@/lib/constants";

const root = process.cwd();

describe("pricing presentation (marketing aligned with backend limits)", () => {
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

  it("keeps TR/EN plan copy key parity and backend-aligned limits", () => {
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

    const en = dictionaries.en.landing.pricing.plans;
    assert.ok(en.free.limits.some((l) => l.includes(String(PLAN_LIMITS.free.projects))));
    assert.ok(
      en.free.limits.some((l) =>
        l.includes(String(PLAN_LIMITS.free.apiKeysPerProject)),
      ),
    );
    assert.ok(
      en.free.limits.some((l) =>
        l.includes(String(AI_MONTHLY_MESSAGE_LIMITS.free)),
      ),
    );
    assert.ok(en.developer.limits.some((l) => l.includes(String(PLAN_LIMITS.pro.projects))));
    assert.ok(
      en.developer.limits.some((l) =>
        l.includes(String(PLAN_LIMITS.pro.apiKeysPerProject)),
      ),
    );
    assert.ok(en.pro.limits.some((l) => l.includes(String(PLAN_LIMITS.pro.projects))));
    assert.ok(
      en.business.limits.some((l) =>
        l.includes(String(PLAN_LIMITS.enterprise.projects)),
      ),
    );
    assert.ok(
      en.business.limits.some((l) =>
        l.includes(String(PLAN_LIMITS.enterprise.apiKeysPerProject)),
      ),
    );
  });

  it("marketing pricing copy does not claim checkout is inactive", () => {
    for (const locale of ["en", "tr"] as const) {
      const pricing = dictionaries[locale].landing.pricing;
      const blob = JSON.stringify({
        meta: pricing.metaDescription,
        secure: pricing.paymentSecureNote,
        methods: pricing.paymentMethodsNote,
        legal: pricing.legalNoteBefore,
        faq: dictionaries[locale].landing.faq.items,
      }).toLowerCase();
      assert.doesNotMatch(blob, /not active/);
      assert.doesNotMatch(blob, /coming soon/);
      assert.doesNotMatch(blob, /henüz aktif değil/);
      assert.doesNotMatch(blob, /yakında/);
      assert.doesNotMatch(blob, /paid checkout is not active/);
    }
  });

  it("paid plans use subscribe CTA kind", () => {
    assert.equal(
      PRICING_PRESENTATION_PLANS.find((p) => p.id === "business")?.ctaKind,
      "subscribe",
    );
  });

  it("marketing pricing cards support gated Lemon checkout", () => {
    const cards = readFileSync(
      join(root, "features/billing/components/marketing-pricing-cards.tsx"),
      "utf8",
    );
    assert.match(cards, /data-checkout=\{checkoutEnabled \? "enabled" : "disabled"\}/);
    assert.match(cards, /\/api\/lemonsqueezy\/checkout/);
    assert.match(cards, /comingSoonTitle/);
  });

  it("pricing page uses presentation cards with checkoutEnabled", () => {
    const page = readFileSync(
      join(root, "app/(marketing)/pricing/page.tsx"),
      "utf8",
    );
    assert.match(page, /MarketingPricingCards/);
    assert.match(page, /checkoutEnabled/);
    assert.doesNotMatch(page, /purchasePlanAction|BILLING_CATALOG/);
  });
});
