import { NextResponse } from "next/server";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { exchangeCodeForSession } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PKCE / email-link callback. Exchanges the `code` returned by Supabase for a
 * session (email verification, password recovery, magic links) and redirects
 * to the `next` destination.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), ROUTES.dashboard);

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();

  try {
    await exchangeCodeForSession(supabase, code);
  } catch {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
