import "server-only";

import { env } from "@/lib/env";

/**
 * Verifies that an incoming request is allowed to run a cron job.
 *
 * Expected header: `Authorization: Bearer <CRON_SECRET>`.
 * Vercel Cron injects this header when `CRON_SECRET` is set in the project env.
 *
 * Security:
 * - Empty / missing `CRON_SECRET` → reject (no open cron surface)
 * - Constant-time compare to reduce timing leaks
 * - `CRON_SECRET` must stay server-only (never `NEXT_PUBLIC_*` / client bundle)
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
