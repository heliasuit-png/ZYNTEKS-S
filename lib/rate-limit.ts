/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * State is per-process, so in a horizontally-scaled or serverless deployment
 * this bounds abuse per instance rather than globally. It is intentionally
 * dependency-free.
 *
 * Future global limiter (optional):
 *   - Replace the `buckets` Map with Redis / Upstash INCR + EXPIRE
 *   - Keep the `rateLimit(key, limit, windowMs)` signature so call sites stay unchanged
 *   - Use a shared key namespace such as `rl:{key}` across instances
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Prune at most this often to keep rateLimit() O(1) amortized. */
const PRUNE_INTERVAL_MS = 30_000;
let lastPruneAt = 0;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup prevents unbounded Map growth from expired keys.
  if (now - lastPruneAt >= PRUNE_INTERVAL_MS) {
    pruneRateLimitBuckets(now);
    lastPruneAt = now;
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Removes expired buckets. Safe to call periodically; cheap when idle. */
export function pruneRateLimitBuckets(now = Date.now()): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/** Test helper — clears all buckets and prune clock. */
export function resetRateLimitStateForTests(): void {
  buckets.clear();
  lastPruneAt = 0;
}
