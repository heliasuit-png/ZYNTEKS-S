/**
 * Structural regression: logout must invalidate access JWTs server-side.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const authService = readFileSync(
  resolve(process.cwd(), "services/auth/auth.service.ts"),
  "utf8",
);
const sessionValidity = readFileSync(
  resolve(process.cwd(), "services/auth/session-validity.ts"),
  "utf8",
);
const middleware = readFileSync(
  resolve(process.cwd(), "supabase/middleware.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/0017_sessions_invalidated_at.sql",
  ),
  "utf8",
);
const forceLogout = readFileSync(
  resolve(process.cwd(), "services/admin/users-actions.service.ts"),
  "utf8",
);

describe("Session invalidation after logout", () => {
  it("adds sessions_invalidated_at via migration", () => {
    assert.match(migration, /sessions_invalidated_at/);
    assert.match(migration, /profiles/);
  });

  it("signOut stamps invalidation before Auth signOut", () => {
    assert.match(authService, /markAllSessionsInvalidated/);
    assert.match(authService, /scope:\s*"global"/);
    const stampIdx = authService.indexOf("markAllSessionsInvalidated");
    const signOutIdx = authService.indexOf('signOut({ scope: "global" })');
    assert.ok(stampIdx > 0 && signOutIdx > stampIdx);
  });

  it("getAuthenticatedUser rejects invalidated access tokens", () => {
    assert.match(authService, /isAccessTokenInvalidated/);
  });

  it("compares JWT iat to sessions_invalidated_at and revoked user_sessions", () => {
    assert.match(sessionValidity, /sessions_invalidated_at/);
    assert.match(sessionValidity, /revoked_at/);
    assert.match(sessionValidity, /iat/);
  });

  it("middleware treats invalidated sessions as logged out", () => {
    assert.match(middleware, /isAccessTokenInvalidated/);
  });

  it("admin force logout stamps the same invalidation path", () => {
    assert.match(forceLogout, /markAllSessionsInvalidated/);
  });
});
