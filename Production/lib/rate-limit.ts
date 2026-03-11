/**
 * In-memory rate limiter for API routes.
 * Use for MVP; in production with multiple instances use Redis (e.g. @upstash/ratelimit).
 */

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? null;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function prune() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check rate limit. Returns { ok: true } if under limit, { ok: false } if over.
 * @param key - Unique key (e.g. "register:1.2.3.4")
 * @param limit - Max requests per window
 * @param windowMs - Window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean } {
  if (store.size > 10_000) prune();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > limit) return { ok: false };
  return { ok: true };
}

/** Get client IP from request (for use as part of rate limit key). */
export { getClientIp as getRateLimitClientIp };
