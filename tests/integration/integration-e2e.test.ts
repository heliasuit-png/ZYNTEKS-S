/**
 * Integration E2E gate (hosted staging only).
 *
 * Mutation suites require INTEGRATION_TARGET=staging and STAGING_* credentials.
 * Docker / local Supabase are not used. Missing staging → BLOCKED (fail-safe).
 */

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createHash, randomBytes } from "node:crypto";

import { API_KEY_PREFIX, SDK_INGEST } from "@/lib/constants";
import { rateLimit, pruneRateLimitBuckets } from "@/lib/rate-limit";
import { discoverIntegrationEnv } from "./setup/env";
import { createDisposableContext } from "./setup/disposable";
import {
  assertNotProductionTarget,
  isProductionAppUrl,
} from "./setup/guard";

type Status = "PASS" | "FAIL" | "BLOCKED";

const results: Record<string, Status> = {
  "TEST 1 — API key creation": "BLOCKED",
  "TEST 2 — Valid heartbeat": "BLOCKED",
  "TEST 3 — Error ingest": "BLOCKED",
  "TEST 4 — Invalid key": "BLOCKED",
  "TEST 5 — Project isolation": "BLOCKED",
  "TEST 6 — Revoke": "BLOCKED",
  "TEST 7 — New key": "BLOCKED",
  "TEST 8 — Rate limit": "BLOCKED",
  "TEST 9 — AI": "BLOCKED",
  "TEST 10 — Logout/session isolation": "BLOCKED",
  "EXTERNAL SDK CLIENT": "BLOCKED",
  CLEANUP: "BLOCKED",
};

function set(name: keyof typeof results, status: Status) {
  results[name] = status;
}

function hashKey(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function makePlainKey(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(32);
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return `${API_KEY_PREFIX}${out}`;
}

describe("integration e2e gate", () => {
  const env = discoverIntegrationEnv();

  it("PRODUCTION SAFETY: refuses production app URL", () => {
    assert.equal(isProductionAppUrl("https://zynteksisv.vercel.app"), true);
    assert.throws(
      () =>
        assertNotProductionTarget({
          baseUrl: "https://zynteksisv.vercel.app",
          supabaseUrl: "http://127.0.0.1:54321",
        }),
    );
  });

  it("ENVIRONMENT: reports discovery without secrets", () => {
    console.log(
      JSON.stringify({
        mode: env.mode,
        blocker: env.blocker,
        presence: env.presence,
        baseHost: env.baseUrl
          ? (() => {
              try {
                return new URL(env.baseUrl).hostname;
              } catch {
                return "invalid";
              }
            })()
          : null,
        supabaseHost: env.supabaseUrl
          ? (() => {
              try {
                return new URL(env.supabaseUrl).hostname;
              } catch {
                return "invalid";
              }
            })()
          : null,
      }),
    );
    assert.ok(env.mode === "ready" || env.mode === "blocked");
  });

  it("TEST 8 — Rate limit unit (always safe)", () => {
    pruneRateLimitBuckets(Date.now() + 1);
    const key = `integration-unit:${Date.now()}`;
    const limit = SDK_INGEST.rateLimit.max;
    const windowMs = SDK_INGEST.rateLimit.windowMs;
    let blocked = false;
    for (let i = 0; i < limit + 1; i += 1) {
      const r = rateLimit(key, limit, windowMs);
      if (!r.allowed) {
        blocked = true;
        break;
      }
    }
    assert.equal(blocked, true);
    assert.equal(limit, 240);
    set("TEST 8 — Rate limit", "PASS");
  });

  it(
    "mutation suite (heartbeat/error/revoke) — staging only",
    { skip: env.mode !== "ready" },
    async () => {
      assert.equal(env.mode, "ready");
      assert.equal(env.target, "staging");
      const ctx = await createDisposableContext();
      after(async () => {
        await ctx.cleanup();
        set("CLEANUP", ctx.cleanupOk ? "PASS" : "FAIL");
        console.log(`CLEANUP: ${ctx.cleanupOk ? "PASS" : "FAIL"}`);
      });

      // Hard stop if somehow pointed at production mid-run
      {
        const health = await fetch(`${ctx.env.baseUrl}/api/health`);
        const hj = (await health.json()) as {
          data?: { supabaseHost?: string };
        };
        const host = hj.data?.supabaseHost ?? "";
        assert.notEqual(host, "xwxfjzyfrcaxdwvkdedq.supabase.co");
        assert.equal(host, "qwylzdzsqjjqdkomezvg.supabase.co");
      }

      // TEST 1
      {
        assert.ok(ctx.keyAPlain.startsWith(API_KEY_PREFIX));
        assert.equal(hashKey(ctx.keyAPlain), ctx.keyAHash);
        const stored = await ctx.admin
          .from("api_keys")
          .select("id, key_hash, project_id, status")
          .eq("id", ctx.keyAId)
          .single();
        assert.equal(stored.error, null);
        assert.equal(stored.data?.key_hash, ctx.keyAHash);
        assert.equal(stored.data?.project_id, ctx.projectAId);
        assert.notEqual(stored.data?.key_hash, ctx.keyAPlain);
        // Plaintext must not appear in hash column
        assert.equal(stored.data?.key_hash?.includes(ctx.keyAPlain), false);
        set("TEST 1 — API key creation", "PASS");
      }

      // TEST 4
      {
        const beforeHb = await ctx.admin
          .from("heartbeats")
          .select("id", { count: "exact", head: true });
        const res = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": `${API_KEY_PREFIX}${"0".repeat(32)}`,
          },
          body: JSON.stringify({ uptime: 1, environment: "development" }),
        });
        assert.equal(res.status, 401);
        const afterHb = await ctx.admin
          .from("heartbeats")
          .select("id", { count: "exact", head: true });
        assert.equal(afterHb.count ?? 0, beforeHb.count ?? 0);
        set("TEST 4 — Invalid key", "PASS");
      }

      // TEST 2
      {
        const res = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": ctx.keyAPlain,
          },
          body: JSON.stringify({
            uptime: 12.5,
            environment: "development",
            release: "int-test",
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { accepted?: boolean };
        };
        assert.equal(res.status, 202);
        assert.equal(json.success, true);
        assert.equal(json.data?.accepted, true);

        const hb = await ctx.admin
          .from("heartbeats")
          .select("id, project_id")
          .eq("project_id", ctx.projectAId)
          .limit(1);
        assert.ok((hb.data?.length ?? 0) >= 1);

        const keyRow = await ctx.admin
          .from("api_keys")
          .select("last_used_at")
          .eq("id", ctx.keyAId)
          .single();
        assert.ok(keyRow.data?.last_used_at);

        const logs = await ctx.admin
          .from("api_key_logs")
          .select("id")
          .eq("api_key_id", ctx.keyAId)
          .limit(1);
        assert.ok((logs.data?.length ?? 0) >= 1);
        set("TEST 2 — Valid heartbeat", "PASS");
      }

      // TEST 3
      {
        const res = await fetch(`${ctx.env.baseUrl}/api/sdk/error`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": ctx.keyAPlain,
          },
          body: JSON.stringify({
            message: "integration disposable error",
            environment: "development",
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { accepted?: boolean };
        };
        assert.equal(res.status, 202);
        assert.equal(json.success, true);
        assert.equal(json.data?.accepted, true);
        const errs = await ctx.admin
          .from("errors")
          .select("id, project_id")
          .eq("project_id", ctx.projectAId)
          .limit(1);
        assert.ok((errs.data?.length ?? 0) >= 1);
        assert.equal(errs.data?.[0]?.project_id, ctx.projectAId);
        set("TEST 3 — Error ingest", "PASS");
      }

      // TEST 5
      {
        const beforeB = await ctx.admin
          .from("heartbeats")
          .select("id", { count: "exact", head: true })
          .eq("project_id", ctx.projectBId);

        const res = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": ctx.keyAPlain,
          },
          body: JSON.stringify({
            uptime: 99,
            environment: "development",
            projectId: ctx.projectBId,
            project_id: ctx.projectBId,
          }),
        });
        assert.equal(res.status, 202);

        const afterB = await ctx.admin
          .from("heartbeats")
          .select("id", { count: "exact", head: true })
          .eq("project_id", ctx.projectBId);
        assert.equal(afterB.count ?? 0, beforeB.count ?? 0);

        const aRows = await ctx.admin
          .from("heartbeats")
          .select("id")
          .eq("project_id", ctx.projectAId);
        assert.ok((aRows.data?.length ?? 0) >= 2);
        set("TEST 5 — Project isolation", "PASS");
      }

      // TEST 6
      {
        await ctx.admin
          .from("api_keys")
          .update({
            status: "revoked",
            revoked_at: new Date().toISOString(),
          })
          .eq("id", ctx.keyAId);

        const res = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": ctx.keyAPlain,
          },
          body: JSON.stringify({ uptime: 1, environment: "development" }),
        });
        assert.equal(res.status, 401);
        set("TEST 6 — Revoke", "PASS");
      }

      // TEST 7
      {
        const newPlain = makePlainKey();
        const newHash = hashKey(newPlain);
        const inserted = await ctx.admin
          .from("api_keys")
          .insert({
            user_id: ctx.userId,
            project_id: ctx.projectAId,
            name: "int-key-recovery",
            key_hash: newHash,
            key_prefix: newPlain.slice(0, API_KEY_PREFIX.length + 4),
            environment: "development",
            status: "active",
          })
          .select("id")
          .single();
        assert.equal(inserted.error, null);

        const ok = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": newPlain,
          },
          body: JSON.stringify({ uptime: 2, environment: "development" }),
        });
        assert.equal(ok.status, 202);

        const old = await fetch(`${ctx.env.baseUrl}/api/sdk/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": ctx.keyAPlain,
          },
          body: JSON.stringify({ uptime: 3, environment: "development" }),
        });
        assert.equal(old.status, 401);
        set("TEST 7 — New key", "PASS");

        // EXTERNAL SDK CLIENT — same contract as external-test-project/@zynteksis/sdk
        // (Node: init() is browser-gated; post the SDK transport paths with the new key)
        {
          const base = ctx.env.baseUrl.replace(/\/+$/, "");
          const headers = {
            "Content-Type": "application/json",
            "X-Zynteksis-Key": newPlain,
          };
          const posts: Array<[string, Record<string, unknown>]> = [
            [
              "/api/sdk/heartbeat",
              {
                uptime: 3.5,
                environment: "development",
                release: "external-test-project",
              },
            ],
            [
              "/api/sdk/error",
              {
                message: "external-test-project disposable error",
                environment: "development",
                release: "external-test-project",
              },
            ],
            [
              "/api/sdk/performance",
              {
                environment: "development",
                release: "external-test-project",
                lcp: 1200,
                cls: 0.01,
                inp: 50,
              },
            ],
            [
              "/api/sdk/events",
              {
                environment: "development",
                release: "external-test-project",
                events: [
                  {
                    type: "test",
                    name: "external_sdk_ping",
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            ],
          ];

          for (const [path, body] of posts) {
            const res = await fetch(`${base}${path}`, {
              method: "POST",
              headers,
              body: JSON.stringify(body),
            });
            assert.equal(
              res.status,
              202,
              `EXTERNAL SDK ${path} expected 202 got ${res.status}`,
            );
          }

          const hb = await ctx.admin
            .from("heartbeats")
            .select("id, project_id")
            .eq("project_id", ctx.projectAId);
          assert.ok((hb.data?.length ?? 0) >= 1);

          const cross = await ctx.admin
            .from("heartbeats")
            .select("id", { count: "exact", head: true })
            .eq("project_id", ctx.projectBId);
          // B must still have zero heartbeats from A/external key
          assert.equal(cross.count ?? 0, 0);
          set("EXTERNAL SDK CLIENT", "PASS");
        }
      }

      // TEST 9 / 10 — require STAGING_OPENAI_API_KEY (never use production OpenAI)
      if (!ctx.env.openaiSet) {
        set("TEST 9 — AI", "BLOCKED");
        set("TEST 10 — Logout/session isolation", "BLOCKED");
      } else {
        set("TEST 9 — AI", "BLOCKED");
        set("TEST 10 — Logout/session isolation", "BLOCKED");
      }
    },
  );

  after(() => {
    console.log("---INTEGRATION_REPORT---");
    for (const [k, v] of Object.entries(results)) {
      console.log(`${k}: ${v}`);
    }
    console.log(
      JSON.stringify({
        mode: env.mode,
        blocker: env.blocker,
        PASS: Object.values(results).filter((s) => s === "PASS").length,
        FAIL: Object.values(results).filter((s) => s === "FAIL").length,
        BLOCKED: Object.values(results).filter((s) => s === "BLOCKED").length,
      }),
    );
  });
});
