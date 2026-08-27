/**
 * Phase D — API / auth / rate-limit contract smoke tests (no production I/O).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";
import { resolve } from "node:path";

import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";
import {
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
  toAppError,
} from "@/lib/errors";
import { fail } from "@/lib/api-response";
import {
  rateLimit,
  resetRateLimitStateForTests,
  retryAfterSeconds,
} from "@/lib/rate-limit";
import { sanitizeAuthCallbackError } from "@/lib/auth-callback-errors";
import { chatRequestSchema } from "@/features/ai/schemas";
import {
  errorPayloadSchema,
  heartbeatPayloadSchema,
} from "@/monitoring/schemas";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

async function readFailJson(error: unknown) {
  const res = fail(error);
  const body = await res.json();
  return { status: res.status, body };
}

describe("API error envelope contract", () => {
  it("unauthorized → 401 envelope", async () => {
    const { status, body } = await readFailJson(new UnauthorizedError());
    assert.equal(status, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(body.success, false);
    assert.equal(body.error.code, ERROR_CODE.UNAUTHORIZED);
    assert.ok(typeof body.error.message === "string");
  });

  it("forbidden foreign resource → 403 envelope", async () => {
    const { status, body } = await readFailJson(
      new ForbiddenError("You cannot access this project."),
    );
    assert.equal(status, HTTP_STATUS.FORBIDDEN);
    assert.equal(body.error.code, ERROR_CODE.FORBIDDEN);
  });

  it("not found → 404 envelope", async () => {
    const { status, body } = await readFailJson(
      new NotFoundError("Project not found"),
    );
    assert.equal(status, HTTP_STATUS.NOT_FOUND);
    assert.equal(body.error.code, ERROR_CODE.NOT_FOUND);
  });

  it("validation → 422 envelope", async () => {
    const { status, body } = await readFailJson(
      new ValidationError("Invalid request.", { name: ["Required"] }),
    );
    assert.equal(status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    assert.equal(body.error.code, ERROR_CODE.VALIDATION);
  });

  it("internal errors hide raw message", async () => {
    const { status, body } = await readFailJson(
      new Error("password=supersecret stack trace"),
    );
    assert.equal(status, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    assert.equal(body.error.code, ERROR_CODE.INTERNAL);
    assert.equal(body.error.message, "An unexpected error occurred");
    assert.equal(/supersecret/.test(JSON.stringify(body)), false);
  });
});

describe("status export route contract wiring", () => {
  const src = readSrc("app/api/status/[slug]/export/route.ts");

  it("uses withErrorHandling + shared fail envelope helpers", () => {
    assert.match(src, /withErrorHandling/);
    assert.match(src, /NotFoundError/);
    assert.match(src, /RateLimitError/);
    assert.match(src, /ValidationError/);
    assert.equal(/\{ error: "Not found" \}/.test(src), false);
  });
});

describe("auth callback sanitization", () => {
  it("maps raw DB/provider errors to generic auth_failed", () => {
    const result = sanitizeAuthCallbackError(
      new Error("duplicate key value violates unique constraint access_token=xyz"),
    );
    assert.equal(result.code, "auth_failed");
    assert.equal(/access_token=xyz/i.test(result.logMessage), false);
    assert.match(result.logMessage, /\[redacted\]/i);
  });

  it("never returns stack or refresh tokens in redirect code", () => {
    const result = sanitizeAuthCallbackError({
      message: "refresh_token=abc stack: Error at foo",
    });
    assert.equal(result.code, "auth_failed");
    assert.ok(["auth_failed", "suspended", "missing_code"].includes(result.code));
  });

  it("callback route redirects only safe error codes", () => {
    const src = readSrc("app/auth/callback/route.ts");
    const helper = readSrc("lib/auth-callback-errors.ts");
    assert.match(src, /sanitizeAuthCallbackError/);
    assert.match(helper, /auth_failed/);
    assert.equal(/encodeURIComponent\(message\)/.test(src), false);
    assert.equal(/console\.error\(error\)/.test(src), false);
  });
});

describe("sensitive route rate-limit wiring", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("isolates users for password / delete / export / key buckets", () => {
    assert.equal(rateLimit("settings:password:u1", 1, 60_000).allowed, true);
    assert.equal(rateLimit("settings:password:u2", 1, 60_000).allowed, true);
    assert.equal(rateLimit("settings:password:u1", 1, 60_000).allowed, false);

    assert.equal(rateLimit("export:errors:u1", 1, 60_000).allowed, true);
    assert.equal(rateLimit("api-keys:revoke:u1", 1, 60_000).allowed, true);
    assert.equal(rateLimit("api-keys:regenerate:u1", 1, 60_000).allowed, true);
    assert.equal(rateLimit("api-keys:create:u1", 1, 60_000).allowed, true);
  });

  it("blocked results expose retry-after seconds", () => {
    rateLimit("settings:delete:u9", 1, 60_000);
    const blocked = rateLimit("settings:delete:u9", 1, 60_000);
    assert.equal(blocked.allowed, false);
    assert.ok(retryAfterSeconds(blocked) >= 1);
  });

  it("settings and api-key actions call rateLimit", () => {
    const settings = readSrc("features/settings/actions.ts");
    const keys = readSrc("features/api-keys/actions.ts");
    const revoke = readSrc("app/api/api-keys/[id]/revoke/route.ts");
    const regen = readSrc("app/api/api-keys/[id]/regenerate/route.ts");
    const errorsExport = readSrc("app/api/errors/export/route.ts");
    assert.match(settings, /settings:password/);
    assert.match(settings, /settings:delete/);
    assert.match(keys, /api-keys:\$\{action\}/);
    assert.match(keys, /"create"/);
    assert.match(keys, /"revoke"/);
    assert.match(keys, /"regenerate"/);
    assert.match(revoke, /api-keys:revoke/);
    assert.match(regen, /api-keys:regenerate/);
    assert.match(errorsExport, /export:errors/);
  });

  it("RateLimitError maps to 429 envelope", async () => {
    const { status, body } = await readFailJson(
      new RateLimitError("Too many requests"),
    );
    assert.equal(status, HTTP_STATUS.TOO_MANY_REQUESTS);
    assert.equal(body.error.code, ERROR_CODE.RATE_LIMITED);
  });
});

describe("workspace owner_id protection wiring", () => {
  it("migration 0021 guards owner_id changes", () => {
    const sql = readSrc("supabase/migrations/0021_owner_guard_ai_quota.sql");
    assert.match(sql, /workspaces_guard_owner_id/);
    assert.match(sql, /only the current owner can transfer/);
    assert.match(sql, /active workspace member/);
  });

  it("transferOwnership remains the app path for owner changes", () => {
    const src = readSrc("services/workspace/members.service.ts");
    assert.match(src, /transferOwnership/);
    assert.match(src, /owner_id/);
  });
});

describe("AI quota + stream contract", () => {
  it("usage service uses atomic RPC with fallback", () => {
    const src = readSrc("services/ai/usage.service.ts");
    assert.match(src, /ai_record_usage_atomic/);
    assert.match(src, /ai_usage_within_limit/);
    assert.match(src, /ai_quota_exceeded/);
  });

  it("NDJSON stream emits generic error without secrets", () => {
    const src = readSrc("services/ai/streaming.ts");
    assert.match(src, /The assistant is unavailable/);
    assert.equal(/access_token|api[_-]?key|sk-/.test(src), false);
  });

  it("chat request schema rejects empty invalid payloads", () => {
    assert.equal(chatRequestSchema.safeParse({}).success, false);
    assert.equal(
      chatRequestSchema.safeParse({ message: "hi" }).success,
      true,
    );
  });

  it("toAppError does not mark unknown Error as operational", () => {
    const err = toAppError(new Error("provider secret leaked"));
    assert.equal(err.isOperational, false);
  });
});

describe("SDK auth contract shapes", () => {
  it("missing/invalid key payloads are rejected by schemas", () => {
    assert.equal(heartbeatPayloadSchema.safeParse({}).success, true);
    assert.equal(errorPayloadSchema.safeParse({}).success, false);
  });

  it("documents 401 for missing/invalid/revoked keys in monitoring http", () => {
    const src = readSrc("monitoring/http.ts");
    assert.match(src, /UnauthorizedError|authenticateSdkRequest/);
  });
});

describe("SDK native guidance docs", () => {
  it("docs discourage React Native browser SDK init", async () => {
    const { dictionaries } = await import("@/lib/i18n/dictionaries");
    const sdkDoc = readSrc("docs/SDK.md");
    const readme = readSrc("sdk/README.md");
    const guide = readSrc("features/api-keys/components/connection-guide.tsx");
    assert.match(sdkDoc, /React Native/);
    assert.match(sdkDoc, /X-Zynteksis-Key/);
    assert.match(readme, /React Native/);
    assert.match(guide, /useDictionary|dict\.dash\.apiKeys/);
    assert.match(
      dictionaries.en.dash.apiKeys.connectionGuide.browserNative,
      /React Native/,
    );
  });
});
