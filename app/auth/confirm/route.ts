import { NextResponse } from "next/server";

import {
  AUTH_CALLBACK_ERROR,
  sanitizeAuthCallbackError,
} from "@/lib/auth-callback-errors";
import { ROUTES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { completeEmailLinkAuth } from "@/services/auth";
import { createSupabaseServerClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Email confirmation / OTP endpoint.
 * Handles `token_hash`+`type` (preferred for mobile) and PKCE `code`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createSupabaseServerClient();

  try {
    const result = await completeEmailLinkAuth(supabase, searchParams);
    if (!result.ok) {
      return NextResponse.redirect(
        `${origin}${ROUTES.login}?error=${AUTH_CALLBACK_ERROR.missing_code}`,
      );
    }
    return NextResponse.redirect(`${origin}${result.next}`);
  } catch (error) {
    const sanitized = sanitizeAuthCallbackError(error);
    logger.warn("Auth confirm verify failed", {
      code: sanitized.code,
      reason: sanitized.logMessage,
    });
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=${sanitized.code}`,
    );
  }
}
