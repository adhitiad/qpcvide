import Redis from "ioredis";

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_API;

  if (!url) {
    console.warn("Redis credentials not found. Rate limiter will use in-memory fallback.");
    return null;
  }

  redis = new Redis(url);
  return redis;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Fallback in-memory store for development if Redis is not available
interface MemoryRateLimitEntry {
  count: number;
  resetAt: number;
}

declare global {
  var __memoryRateLimiter: Map<string, MemoryRateLimitEntry> | undefined;
}

const memoryStore = global.__memoryRateLimiter || new Map<string, MemoryRateLimitEntry>();

if (process.env.NODE_ENV === "development") {
  global.__memoryRateLimiter = memoryStore;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const client = getRedisClient();
  const { maxRequests, windowSeconds } = config;

  if (client) {
    try {
      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, maxRequests - current);
      return { allowed: current <= maxRequests, remaining };
    } catch (error) {
      console.error("Redis rate limit error:", error);
      // Fallback to in-memory if Redis fails
    }
  }

  // In-memory fallback
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
  }

  entry.count++;
  memoryStore.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);

  // Random cleanup
  if (Math.random() < 0.05) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) memoryStore.delete(k);
    }
  }

  return { allowed: entry.count <= maxRequests, remaining };
}
