import "server-only";

import { env } from "@/lib/env";

/**
 * Verifies that an incoming request originates from Vercel Cron by comparing
 * the `Authorization: Bearer <CRON_SECRET>` header against the configured
 * secret. Uses a constant-time comparison to avoid timing attacks.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }

  const expected = `Bearer ${secret}`;
  return timingSafeEqual(header, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
