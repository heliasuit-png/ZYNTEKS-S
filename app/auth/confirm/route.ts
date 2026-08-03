import { NextResponse } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { ROUTES } from "@/lib/constants";
import { safeNextPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token-hash confirmation endpoint. Verifies an email OTP (`signup`,
 * `recovery`, `email_change`, ...) and redirects to the `next` destination.
 * Compatible with Supabase email templates that use `{{ .TokenHash }}`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), ROUTES.dashboard);

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=invalid_link`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.login}?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
