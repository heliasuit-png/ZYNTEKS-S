import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  ADMIN_ROUTES,
  GUEST_ONLY_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  ROUTES,
} from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isAdminLoginPath(pathname: string): boolean {
  return matchesPrefix(pathname, ADMIN_ROUTES.login);
}

function isAdminPath(pathname: string): boolean {
  return matchesPrefix(pathname, ADMIN_ROUTES.root);
}

/**
 * Determines where a request should be redirected based on authentication
 * state. Returns a relative path to redirect to, or `null` to continue.
 *
 * Admin Control Center (`/admin/*`):
 * - Unauthenticated non-login → `/admin/login` (with safe redirect back)
 * - `/admin/login` is never forced to product `/login` or `/dashboard`
 * - Role membership (`admin_users`) is enforced in `app/(admin)/layout.tsx`
 *
 * Product app:
 * - Unauthenticated access to a protected route → `/login`
 * - Authenticated access to a guest-only route → `/dashboard` (or safe redirect)
 */
export function resolveAuthRedirectPath(
  request: NextRequest,
  user: User | null,
): string | null {
  const { pathname, search } = request.nextUrl;

  // --- Enterprise Admin Control Center (isolated from product auth redirects)
  if (isAdminPath(pathname)) {
    if (isAdminLoginPath(pathname)) {
      return null;
    }
    if (!user) {
      const target = encodeURIComponent(`${pathname}${search}`);
      return `${ADMIN_ROUTES.login}?redirect=${target}`;
    }
    return null;
  }

  const isProtected = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
  if (isProtected && !user) {
    const target = encodeURIComponent(`${pathname}${search}`);
    return `${ROUTES.login}?redirect=${target}`;
  }

  const isGuestOnly = GUEST_ONLY_ROUTES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
  if (isGuestOnly && user) {
    // Honor a safe post-auth deep link when already signed in.
    return safeNextPath(
      request.nextUrl.searchParams.get("redirect"),
      ROUTES.dashboard,
    );
  }

  return null;
}
