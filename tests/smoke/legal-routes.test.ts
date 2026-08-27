import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROUTES } from "@/lib/constants";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  getLegalDocument,
} from "@/features/landing/data/legal-content";
import { LEGAL_LAST_UPDATED_TR } from "@/features/landing/data/legal/tr/terms";

describe("legal routes and canonical content", () => {
  it("exposes canonical /legal/* paths", () => {
    assert.equal(ROUTES.legalPrivacy, "/legal/privacy");
    assert.equal(ROUTES.legalTerms, "/legal/terms");
    assert.equal(ROUTES.legalCookie, "/legal/cookie");
    assert.equal(ROUTES.legalKvkk, "/legal/kvkk");
    assert.equal(
      ROUTES.legalDistanceSales,
      "/legal/distance-sales-agreement",
    );
    assert.equal(
      ROUTES.legalPreliminaryInformation,
      "/legal/preliminary-information-form",
    );
    assert.equal(ROUTES.legalRefundCancellation, "/legal/refund-cancellation");
  });

  it("keeps legacy privacy/terms aliases for redirects", () => {
    assert.equal(ROUTES.privacy, "/privacy");
    assert.equal(ROUTES.terms, "/terms");
  });

  it("uses canonical operator identity (not TODO placeholders)", () => {
    assert.equal(LEGAL_OPERATOR.name, "Aysel Nur Akıncı");
    assert.equal(LEGAL_OPERATOR.registrationNo, "1160825918");
    assert.match(LEGAL_OPERATOR.address, /Silivri/);
    assert.equal(LEGAL_OPERATOR.email, "Hello@heliasuit.com");
    assert.equal(LEGAL_LAST_UPDATED, "August 27, 2026");
  });

  it("loads EN and TR bodies for all seven documents", () => {
    const kinds = [
      "terms",
      "distance-sales",
      "preliminary-information",
      "refund-cancellation",
      "privacy",
      "cookie",
      "kvkk",
    ] as const;

    for (const kind of kinds) {
      const en = getLegalDocument(kind, "en");
      const tr = getLegalDocument(kind, "tr");
      assert.equal(en.lastUpdated, LEGAL_LAST_UPDATED);
      assert.equal(tr.lastUpdated, LEGAL_LAST_UPDATED_TR);
      assert.ok(en.intro.length > 0);
      assert.ok(tr.intro.length > 0);
      assert.ok(en.sections.length > 0);
      assert.ok(tr.sections.length > 0);
      assert.notEqual(en.intro[0], tr.intro[0]);
      assert.match(JSON.stringify(en), /Aysel Nur Akıncı/);
      assert.match(JSON.stringify(tr), /Aysel Nur Akıncı/);
      assert.doesNotMatch(JSON.stringify(en), /TODO/i);
      assert.doesNotMatch(JSON.stringify(tr), /TODO/i);
    }
  });
});
