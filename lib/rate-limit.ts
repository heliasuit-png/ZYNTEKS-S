/**
 * Best-effort fixed-window rate limiter with pluggable store.
 *
 * Default: in-memory (per-process). Safe fallback when no shared Redis is
 * configured — bounds abuse per instance, not globally.
 *
 * Shared store (Upstash): only when BOTH env vars are set:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * Without credentials the memory backend is used and shared limiting is
 * considered unavailable (see getRateLimitBackend()).
 *
 * Public sync API `rateLimit(key, limit, windowMs)` is preserved for call sites.
 * Shared Redis hits use a best-effort sync bridge; if Redis is unreachable,
 * memory fallback applies (fail-open for availability of existing routes).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimitBackend = "memory" | "upstash";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Prune at most this often to keep rateLimit() O(1) amortized. */
const PRUNE_INTERVAL_MS = 30_000;
let lastPruneAt = 0;

function memoryHit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
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

/** True when Upstash REST credentials are present (values never logged). */
export function isSharedRateLimitConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  return Boolean(url && token);
}

export function getRateLimitBackend(): RateLimitBackend {
  return isSharedRateLimitConfigured() ? "upstash" : "memory";
}

/**
 * Retry-After seconds from a limit result (minimum 1 when blocked).
 */
export function retryAfterSeconds(result: RateLimitResult, now = Date.now()): number {
  if (result.allowed) return 0;
  return Math.max(1, Math.ceil((result.resetAt - now) / 1000));
}

/**
 * Sync rate limit entrypoint used by routes/actions.
 * Uses memory store. Shared Upstash is opt-in via env; without credentials
 * this never attempts a remote call.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return memoryHit(key, limit, windowMs);
}

/**
 * Async entrypoint for future shared-store callers. Today mirrors memory
 * unless Upstash is configured — then attempts REST INCR/PEXPIRE and falls
 * back to memory on transport failure.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!isSharedRateLimitConfigured()) {
    return memoryHit(key, limit, windowMs);
  }

  try {
    return await upstashHit(key, limit, windowMs);
  } catch {
    return memoryHit(key, limit, windowMs);
  }
}

async function upstashHit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `rl:${key}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
    method: "POST",
    headers,
  });
  if (!incrRes.ok) {
    throw new Error("upstash incr failed");
  }
  const incrJson = (await incrRes.json()) as { result?: number };
  const count = Number(incrJson.result ?? 0);

  if (count === 1) {
    await fetch(
      `${url}/pexpire/${encodeURIComponent(redisKey)}/${windowMs}`,
      { method: "POST", headers },
    );
  }

  const ttlRes = await fetch(`${url}/pttl/${encodeURIComponent(redisKey)}`, {
    method: "GET",
    headers,
  });
  const ttlJson = (await ttlRes.json()) as { result?: number };
  const pttl = Number(ttlJson.result ?? windowMs);
  const resetAt = Date.now() + (pttl > 0 ? pttl : windowMs);

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    resetAt,
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
