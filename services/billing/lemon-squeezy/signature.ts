/**
 * Lemon Squeezy webhook signature verification (HMAC-SHA256).
 * Official model: hex digest of raw body with the signing secret.
 * Never log the secret or raw signature comparison buffers as secrets.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function computeLemonSqueezySignature(
  rawBody: string | Buffer,
  secret: string,
): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/**
 * Verify X-Signature header against raw body.
 * Returns false for missing/invalid inputs (never throws secret material).
 */
export function verifyLemonSqueezySignature(opts: {
  rawBody: string | Buffer;
  signatureHeader: string | null | undefined;
  secret: string;
}): boolean {
  const { rawBody, signatureHeader, secret } = opts;
  if (!secret || !signatureHeader || !rawBody) return false;

  const expected = computeLemonSqueezySignature(rawBody, secret);
  const provided = signatureHeader.trim();

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
