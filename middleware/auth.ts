import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  GUEST_ONLY_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  ROUTES,
} from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Determines where a request should be redirected based on authentication
 * state. Returns a relative path to redirect to, or `null` to continue.
 *
 * - Unauthenticated access to a protected route -> `/login` (with a `redirect`
 *   back to the originally requested URL).
 * - Authenticated access to a guest-only route (login/register/forgot) ->
 *   `/dashboard`.
 */
export function resolveAuthRedirectPath(
  request: NextRequest,
  user: User | null,
): string | null {
  const { pathname, search } = request.nextUrl;

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
