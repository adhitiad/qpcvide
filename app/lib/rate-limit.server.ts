/**
 * Simple In-Memory Rate Limiter
 * 
 * NOTE: For a single-node setup (like standard VPS or local dev), an in-memory Map is sufficient.
 * If deploying to a multi-node/serverless cluster, this needs to be swapped with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global scope to survive Remix dev server reloads
declare global {
  var __rateLimiter: Map<string, RateLimitEntry> | undefined;
}

const store = global.__rateLimiter || new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV === "development") {
  global.__rateLimiter = store;
}

/**
 * Checks if a key has exceeded its rate limit.
 * 
 * @param key Unique identifier (e.g., "like:user123" or "view:ipAddress:video1")
 * @param limit Max number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns Rate limit status
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Reset or create new entry
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  // Cleanup old entries randomly to prevent memory leak
  if (Math.random() < 0.05) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k);
    }
  }

  return {
    success,
    limit,
    remaining,
    resetAt: entry.resetAt,
  };
}
