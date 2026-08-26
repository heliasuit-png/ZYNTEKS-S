import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROUTES } from "@/lib/constants";
import { LEGAL_TODO } from "@/features/landing/data/legal-content";

describe("legal routes and draft content", () => {
  it("exposes canonical /legal/* paths (cookie singular)", () => {
    assert.equal(ROUTES.legalPrivacy, "/legal/privacy");
    assert.equal(ROUTES.legalTerms, "/legal/terms");
    assert.equal(ROUTES.legalCookie, "/legal/cookie");
    assert.equal(ROUTES.legalKvkk, "/legal/kvkk");
  });

  it("keeps legacy privacy/terms aliases for redirects", () => {
    assert.equal(ROUTES.privacy, "/privacy");
    assert.equal(ROUTES.terms, "/terms");
  });

  it("uses TODO placeholders instead of invented company identity", () => {
    assert.match(LEGAL_TODO.companyName, /TODO/i);
    assert.match(LEGAL_TODO.address, /TODO/i);
    assert.match(LEGAL_TODO.email, /TODO/i);
    assert.match(LEGAL_TODO.dataController, /TODO/i);
  });
});
