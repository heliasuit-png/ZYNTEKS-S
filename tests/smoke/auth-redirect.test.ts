import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { resolveAuthRedirectPath } from "@/middleware/auth";

describe("H1 authentication redirect flow", () => {
  it("safeNextPath accepts same-origin relative paths", () => {
    assert.equal(safeNextPath("/errors", ROUTES.dashboard), "/errors");
    assert.equal(
      safeNextPath("/projects?tab=1", ROUTES.dashboard),
      "/projects?tab=1",
    );
  });

  it("safeNextPath rejects open redirects", () => {
    assert.equal(safeNextPath("//evil.com", ROUTES.dashboard), ROUTES.dashboard);
    assert.equal(
      safeNextPath("https://evil.com", ROUTES.dashboard),
      ROUTES.dashboard,
    );
    assert.equal(
      safeNextPath("/\\evil.com", ROUTES.dashboard),
      ROUTES.dashboard,
    );
    assert.equal(safeNextPath("", ROUTES.dashboard), ROUTES.dashboard);
  });

  it("middleware sends unauthenticated users to login with redirect param", () => {
    const request = new NextRequest("http://localhost:3000/errors/abc");
    const path = resolveAuthRedirectPath(request, null);
    assert.ok(path?.startsWith(`${ROUTES.login}?redirect=`));
    const encoded = path!.split("redirect=")[1]!;
    assert.equal(decodeURIComponent(encoded), "/errors/abc");
  });

  it("authenticated guest-only visit honors safe redirect query", () => {
    const request = new NextRequest(
      "http://localhost:3000/login?redirect=%2Fapi-keys",
    );
    const path = resolveAuthRedirectPath(request, {
      id: "user-1",
    } as never);
    assert.equal(path, "/api-keys");
  });

  it("authenticated guest-only visit falls back to dashboard for unsafe redirect", () => {
    const request = new NextRequest(
      "http://localhost:3000/login?redirect=https%3A%2F%2Fevil.com",
    );
    const path = resolveAuthRedirectPath(request, {
      id: "user-1",
    } as never);
    assert.equal(path, ROUTES.dashboard);
  });
});
