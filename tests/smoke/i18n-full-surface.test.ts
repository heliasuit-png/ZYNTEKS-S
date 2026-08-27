import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { dictionaries } from "@/lib/i18n/dictionaries";
import { LOCALES } from "@/lib/i18n/config";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  const out: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key;
    out.push(...leafPaths(child, next));
  }
  return out;
}

describe("i18n surface coverage + payment methods UI", () => {
  it("keeps en/tr key parity after full dictionary expansion", () => {
    const enKeys = leafPaths(dictionaries.en).sort();
    const trKeys = leafPaths(dictionaries.tr).sort();
    assert.deepEqual(trKeys, enKeys);
    assert.ok(enKeys.length > 100, "dictionary should be substantially expanded");
  });

  it("covers required public/auth/docs/dashboard sections", () => {
    for (const locale of LOCALES) {
      const d = dictionaries[locale];
      assert.ok(d.landing.hero.headline.length > 0);
      assert.ok(d.landing.faq.items.length >= 6);
      assert.ok(d.docs.title.length > 0);
      assert.ok(d.authForms.signIn.length > 0);
      assert.ok(d.dashboard.pageTitles.projects.title.length > 0);
      assert.ok(d.footer.paymentMethods.length > 0);
      assert.ok(d.footer.paymentVisa.length > 0);
      assert.ok(d.footer.paymentDiners.length > 0);
    }
  });

  it("ships payment methods row without PCI claims or Lemon hooks", () => {
    const src = readFileSync(
      "features/landing/components/payment-methods-row.tsx",
      "utf8",
    );
    assert.match(src, /VisaMark|VISA/);
    assert.match(src, /MastercardMark|mastercard/i);
    assert.match(src, /AmexMark|AMEX/);
    assert.match(src, /DiscoverMark|DISCOVER/);
    assert.match(src, /DinersMark|DINERS/);
    assert.match(src, /flex-wrap/);
    assert.doesNotMatch(src, /PCI DSS|256-bit SSL|lemonsqueezy\.com|createCheckout/i);

    const footer = readFileSync(
      "features/landing/components/landing-footer.tsx",
      "utf8",
    );
    assert.match(footer, /PaymentMethodsRow/);
    assert.doesNotMatch(footer, /lemonsqueezy\.com|createCheckout/i);
  });

  it("avoids hardcoded English hero copy in landing-hero", () => {
    const hero = readFileSync(
      "features/landing/components/landing-hero.tsx",
      "utf8",
    );
    assert.match(hero, /useDictionary|dict\.landing/);
    assert.doesNotMatch(hero, /Observe\. Analyze\. Ship/);
  });
});
