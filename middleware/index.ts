import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/supabase/middleware";
import { resolveAuthRedirectPath } from "@/middleware/auth";

/**
 * Root request middleware. Responsibilities are kept small and composable:
 * it refreshes the Supabase auth session and enforces route protection.
 * Additional concerns (rate limiting, localization, feature flags) should be
 * added as isolated steps composed here.
 */
export async function handleRequest(
  request: NextRequest,
): Promise<NextResponse> {
  const { response, user } = await updateSupabaseSession(request);

  const redirectPath = resolveAuthRedirectPath(request, user);
  if (redirectPath) {
    const redirectResponse = NextResponse.redirect(
      new URL(redirectPath, request.url),
    );
    // Preserve any refreshed auth cookies on the redirect response.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

/**
 * Matcher configuration. Static assets and image optimization requests are
 * excluded so the middleware only runs for application traffic.
 */
export const middlewareMatcher = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
];
