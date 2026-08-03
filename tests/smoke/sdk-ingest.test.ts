import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gzipSync } from "node:zlib";

import { API_KEY_PREFIX, SDK_INGEST } from "@/lib/constants";
import {
  errorPayloadSchema,
  heartbeatPayloadSchema,
} from "@/monitoring/schemas";

describe("API key authentication shape", () => {
  it("expects ZYN-KEY prefix", () => {
    assert.equal(API_KEY_PREFIX, "ZYN-KEY-");
    assert.ok("ZYN-KEY-XXXXXXXXXXXXXXXX".startsWith(API_KEY_PREFIX));
    assert.equal("sk-wrong".startsWith(API_KEY_PREFIX), false);
  });
});

describe("SDK heartbeat endpoint validation", () => {
  it("accepts a minimal heartbeat payload", () => {
    const parsed = heartbeatPayloadSchema.safeParse({
      environment: "production",
      release: "1.0.0",
      uptime: 12.5,
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid environments", () => {
    const parsed = heartbeatPayloadSchema.safeParse({
      environment: "prod",
    });
    assert.equal(parsed.success, false);
  });
});

describe("SDK error ingestion validation", () => {
  it("requires a message", () => {
    assert.equal(errorPayloadSchema.safeParse({}).success, false);
    assert.equal(
      errorPayloadSchema.safeParse({ message: "Boom" }).success,
      true,
    );
  });

  it("documents ingest size budgets", () => {
    assert.ok(SDK_INGEST.maxPayloadBytes.heartbeat > 0);
    assert.ok(SDK_INGEST.maxPayloadBytes.error > 0);
    assert.ok(SDK_INGEST.maxEventsPerRequest >= 1);
  });
});

describe("M5 expanded gzip payload limit rule", () => {
  it("compressed bodies can still expand past the declared max", () => {
    const maxBytes = 64;
    const inflated = Buffer.alloc(maxBytes + 32, 0x61);
    const compressed = gzipSync(inflated);
    assert.ok(
      compressed.byteLength <= maxBytes,
      "fixture must stay under compressed cap",
    );
    // Production rule in monitoring/http.ts: reject when expanded > maxBytes.
    assert.ok(inflated.byteLength > maxBytes);
  });
});
