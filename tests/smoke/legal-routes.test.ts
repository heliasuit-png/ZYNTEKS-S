import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROUTES } from "@/lib/constants";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  getLegalDocument,
} from "@/features/landing/data/legal-content";

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

  it("loads all seven legal documents with Last Updated date", () => {
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
      const doc = getLegalDocument(kind);
      assert.equal(doc.lastUpdated, LEGAL_LAST_UPDATED);
      assert.ok(doc.intro.length > 0);
      assert.ok(doc.sections.length > 0);
      assert.match(JSON.stringify(doc), /Aysel Nur Akıncı/);
      assert.doesNotMatch(JSON.stringify(doc), /TODO/i);
    }
  });
});
