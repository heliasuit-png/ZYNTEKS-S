import type { EmailOtpType, Session } from "@supabase/supabase-js";

import {
  AUTH_CALLBACK_ERROR,
  type AuthCallbackErrorCode,
} from "@/lib/auth-callback-errors";
import { safeNextPath } from "@/lib/safe-redirect";
import { ROUTES } from "@/lib/constants";
import {
  exchangeCodeForSession,
  verifyEmailOtp,
} from "@/services/auth/auth.service";
import type { TypedSupabaseClient } from "@/supabase/client";

export type EmailLinkAuthResult =
  | { ok: true; session: Session; next: string }
  | { ok: false; code: AuthCallbackErrorCode };

/**
 * Completes an email confirmation / magic-link / recovery redirect.
 *
 * Supports both:
 * - PKCE `?code=` (exchangeCodeForSession)
 * - Token-hash `?token_hash=&type=` (verifyOtp) — works across browsers/apps
 *   without the original PKCE cookie (critical on mobile mail clients).
 */
export async function completeEmailLinkAuth(
  supabase: TypedSupabaseClient,
  searchParams: URLSearchParams,
): Promise<EmailLinkAuthResult> {
  const next = safeNextPath(searchParams.get("next"), ROUTES.dashboard);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const session = await verifyEmailOtp(supabase, { type, tokenHash });
    return { ok: true, session, next };
  }

  if (code) {
    const session = await exchangeCodeForSession(supabase, code);
    return { ok: true, session, next };
  }

  return { ok: false, code: AUTH_CALLBACK_ERROR.missing_code };
}
