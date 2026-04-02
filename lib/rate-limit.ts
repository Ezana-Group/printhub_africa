/**
 * Rate limiter for API routes.
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, uses Redis (@upstash/ratelimit)
 * for shared state across instances. Otherwise uses in-memory store (single-instance only).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

function rateLimitInMemory(key: string, limit: number, windowMs: number): { success: boolean; remaining: number; resetAt: Date } {
  if (store.size > 10_000) prune();
  const now = Date.now();
  const entry = store.get(key);
  
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt: new Date(resetAt) };
  }
  
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;
  
  return { success, remaining, resetAt: new Date(entry.resetAt) };
}

const redisLimiters = new Map<string, Ratelimit>();

function getRedisRatelimit(limit: number, windowSec: number): Ratelimit | null {
  const cacheKey = `${limit}:${windowSec}`;
  const cached = redisLimiters.get(cacheKey);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const redis = new Redis({ url, token });
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "rl",
    });
    redisLimiters.set(cacheKey, rl);
    return rl;
  } catch {
    return null;
  }
}

/**
 * Check rate limit. Returns success state with remaining quota and reset time.
 * Uses Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set; otherwise in-memory.
 */
export async function rateLimit(key: string, options: { limit: number; windowMs: number }): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  const { limit, windowMs } = options;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const rl = getRedisRatelimit(limit, windowSec);
  
  if (rl) {
    const result = await rl.limit(key);
    return { 
      success: result.success, 
      remaining: result.remaining, 
      resetAt: new Date(result.reset) 
    };
  }
  
  return Promise.resolve(rateLimitInMemory(key, limit, windowMs));
}

/** Get client IP from request (for use as part of rate limit key). */
export { getClientIp as getRateLimitClientIp };
