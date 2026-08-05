import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { ERROR_CODE, HTTP_STATUS } from "@/lib/constants";

/** Fixed-window auth rate limits (per-instance). */
export function assertAuthRateLimit(
  bucket: string,
  limit = 12,
  windowMs = 60_000,
): void {
  const result = rateLimit(`auth:${bucket}`, limit, windowMs);
  if (!result.allowed) {
    throw new AppError("Too many authentication attempts. Please try again shortly.", {
      code: ERROR_CODE.RATE_LIMITED,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      details: { resetAt: result.resetAt },
    });
  }
}
