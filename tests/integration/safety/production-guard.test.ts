import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertNotProductionTarget,
  isProductionAppUrl,
  isProductionSupabaseUrl,
  ProductionGuardError,
} from "../setup/guard";
import { discoverIntegrationEnv } from "../setup/env";

describe("integration production safety", () => {
  it("detects production app hosts", () => {
    assert.equal(isProductionAppUrl("https://zynteksisv.vercel.app"), true);
    assert.equal(isProductionAppUrl("https://zynteksisv.vercel.app/"), true);
    assert.equal(isProductionAppUrl("http://127.0.0.1:3000"), false);
  });

  it("detects production Supabase host", () => {
    assert.equal(
      isProductionSupabaseUrl("https://xwxfjzyfrcaxdwvkdedq.supabase.co"),
      true,
    );
    assert.equal(
      isProductionSupabaseUrl("https://example-staging.supabase.co"),
      false,
    );
  });

  it("throws when mutation target is production app", () => {
    assert.throws(
      () =>
        assertNotProductionTarget({
          baseUrl: "https://zynteksisv.vercel.app",
          supabaseUrl: "https://example-staging.supabase.co",
        }),
      (err: unknown) =>
        err instanceof ProductionGuardError &&
        err.message.includes("cannot mutate Zynteksis production"),
    );
  });

  it("throws when mutation target is production Supabase", () => {
    assert.throws(
      () =>
        assertNotProductionTarget({
          baseUrl: "http://127.0.0.1:3000",
          supabaseUrl: "https://xwxfjzyfrcaxdwvkdedq.supabase.co",
        }),
      ProductionGuardError,
    );
  });

  it("allows non-production staging-shaped targets", () => {
    assert.doesNotThrow(() =>
      assertNotProductionTarget({
        baseUrl: "http://127.0.0.1:3000",
        supabaseUrl: "https://example-staging.supabase.co",
      }),
    );
  });
});

describe("integration staging env gate", () => {
  it("reports mode without printing secrets", () => {
    const env = discoverIntegrationEnv();
    assert.ok(env.mode === "ready" || env.mode === "blocked");
    assert.ok(env.presence);
    for (const v of Object.values(env.presence)) {
      assert.ok(v === "SET" || v === "UNSET");
    }
    if (env.mode === "blocked") {
      assert.ok(typeof env.blocker === "string" && env.blocker.length > 0);
      assert.match(env.blocker, /STAGING SUPABASE REQUIRED|BLOCKED:/);
    }
  });

  it("does not become ready without INTEGRATION_TARGET=staging", () => {
    const prev = process.env.INTEGRATION_TARGET;
    delete process.env.INTEGRATION_TARGET;
    try {
      const env = discoverIntegrationEnv();
      // Without staging credentials this must never be ready.
      if (
        !process.env.STAGING_SUPABASE_URL ||
        !process.env.STAGING_SUPABASE_ANON_KEY ||
        !process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY
      ) {
        assert.equal(env.mode, "blocked");
      }
    } finally {
      if (prev === undefined) delete process.env.INTEGRATION_TARGET;
      else process.env.INTEGRATION_TARGET = prev;
    }
  });
});
