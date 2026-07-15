/**
 * Simple in-memory rate limiter.
 *
 * LIMITATION: This in-memory implementation does not enforce limits correctly across
 * Vercel serverless functions or multi-instance/distributed environments since memory
 * state is not shared. Upgrade path: switch to @upstash/ratelimit with Upstash Redis.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/** Purge expired records every 5 minutes to prevent memory leaks */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    if (record.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum requests allowed within `windowMs` */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Check if a given key (e.g. userId or IP) has exceeded the rate limit.
 * Returns `{ ok: true }` if under the limit, or `{ ok: false, retryAfterMs }` if over.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }

  if (record.count >= options.limit) {
    return { ok: false, retryAfterMs: record.resetAt - now };
  }

  record.count++;
  return { ok: true };
}
