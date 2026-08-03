import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  pruneRateLimitBuckets,
  rateLimit,
  resetRateLimitStateForTests,
} from "@/lib/rate-limit";

describe("H4 rate limiting", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("allows requests under the limit and blocks after", () => {
    const key = "smoke:rl";
    assert.equal(rateLimit(key, 2, 60_000).allowed, true);
    assert.equal(rateLimit(key, 2, 60_000).allowed, true);
    assert.equal(rateLimit(key, 2, 60_000).allowed, false);
  });

  it("pruneRateLimitBuckets removes expired entries", () => {
    const key = "smoke:expire";
    rateLimit(key, 5, 1);
    const past = Date.now() + 50;
    // Force expiry by pruning with a future clock after the 1ms window.
    pruneRateLimitBuckets(past);
    const again = rateLimit(key, 5, 60_000);
    assert.equal(again.allowed, true);
    assert.equal(again.remaining, 4);
  });
});
