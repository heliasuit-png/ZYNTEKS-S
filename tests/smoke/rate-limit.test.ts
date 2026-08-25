import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  getRateLimitBackend,
  isSharedRateLimitConfigured,
  pruneRateLimitBuckets,
  rateLimit,
  resetRateLimitStateForTests,
  retryAfterSeconds,
} from "@/lib/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("allows requests under the limit and blocks after", () => {
    const key = "smoke:rl";
    assert.equal(rateLimit(key, 2, 60_000).allowed, true);
    assert.equal(rateLimit(key, 2, 60_000).allowed, true);
    assert.equal(rateLimit(key, 2, 60_000).allowed, false);
  });

  it("reports remaining and retry-after when blocked", () => {
    const key = "smoke:retry";
    rateLimit(key, 1, 60_000);
    const blocked = rateLimit(key, 1, 60_000);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(retryAfterSeconds(blocked) >= 1);
  });

  it("isolates independent users and projects", () => {
    assert.equal(rateLimit("user:a", 1, 60_000).allowed, true);
    assert.equal(rateLimit("user:b", 1, 60_000).allowed, true);
    assert.equal(rateLimit("user:a", 1, 60_000).allowed, false);
    assert.equal(rateLimit("project:p1", 1, 60_000).allowed, true);
    assert.equal(rateLimit("project:p2", 1, 60_000).allowed, true);
  });

  it("resets after the window expires", () => {
    const key = "smoke:window";
    assert.equal(rateLimit(key, 1, 1).allowed, true);
    assert.equal(rateLimit(key, 1, 1).allowed, false);
    pruneRateLimitBuckets(Date.now() + 50);
    assert.equal(rateLimit(key, 1, 60_000).allowed, true);
  });

  it("defaults to memory backend without Upstash credentials", () => {
    assert.equal(isSharedRateLimitConfigured(), false);
    assert.equal(getRateLimitBackend(), "memory");
  });

  it("pruneRateLimitBuckets removes expired entries", () => {
    const key = "smoke:expire";
    rateLimit(key, 5, 1);
    const past = Date.now() + 50;
    pruneRateLimitBuckets(past);
    const again = rateLimit(key, 5, 60_000);
    assert.equal(again.allowed, true);
    assert.equal(again.remaining, 4);
  });
});
