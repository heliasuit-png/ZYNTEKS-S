import "server-only";

import type { TypedSupabaseClient } from "@/supabase/client";
import { listMfaFactors } from "@/services/auth/auth.service";

/**
 * MFA / TOTP helpers (Supabase Auth factors). Enrollment UI can call these;
 * `profiles.mfa_enabled` is a cached UI flag — Auth factors remain source of truth.
 * WebAuthn/passkeys: see `webauthn_credentials` table (architecture-ready).
 */
export async function getMfaStatus(supabase: TypedSupabaseClient) {
  const factors = await listMfaFactors(supabase);
  const totp = factors.totp ?? [];
  const phone = factors.phone ?? [];
  const verified = [...totp, ...phone].filter(
    (factor) => factor.status === "verified",
  );
  return {
    enrolled: verified.length > 0,
    totpCount: totp.filter((f) => f.status === "verified").length,
    phoneCount: phone.filter((f) => f.status === "verified").length,
    factors,
  };
}
