import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";

import {
  DASHBOARD_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  ROUTES,
} from "@/lib/constants";
import { resolveAuthRedirectPath } from "@/middleware/auth";
import {
  hasPermission,
  permissionsForRole,
} from "@/services/workspace/permissions";

describe("Dashboard load protection", () => {
  it("protects the dashboard route prefix", () => {
    assert.ok(PROTECTED_ROUTE_PREFIXES.includes("/dashboard"));
    const request = new NextRequest("http://localhost:3000/dashboard");
    const path = resolveAuthRedirectPath(request, null);
    assert.ok(path?.startsWith(`${ROUTES.login}?redirect=`));
  });

  it("exposes core dashboard destinations", () => {
    assert.equal(DASHBOARD_ROUTES.dashboard, "/dashboard");
    assert.equal(DASHBOARD_ROUTES.projects, "/projects");
    assert.equal(DASHBOARD_ROUTES.apiKeys, "/api-keys");
  });
});

describe("Workspace access (RBAC)", () => {
  it("owners have workspace and project permissions", () => {
    const perms = permissionsForRole("owner");
    assert.ok(hasPermission("owner", "workspace:read"));
    assert.ok(hasPermission("owner", "projects:create"));
    assert.ok(perms.includes("members:invite"));
  });

  it("viewers cannot manage API keys or delete workspace", () => {
    assert.equal(hasPermission("viewer", "api_keys:manage"), false);
    assert.equal(hasPermission("viewer", "workspace:delete"), false);
    assert.ok(hasPermission("viewer", "projects:read"));
  });

  it("unknown roles deny by default", () => {
    assert.equal(hasPermission("not_a_role" as never, "workspace:read"), false);
  });
});
