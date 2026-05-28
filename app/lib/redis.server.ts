import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis credentials not found. Caching disabled.");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Cache-through helper: checks Redis first, falls back to queryFn on miss.
 * Gracefully degrades if Redis is unavailable.
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  queryFn: () => Promise<T>
): Promise<T> {
  const client = getRedis();

  if (!client) {
    return queryFn();
  }

  try {
    const cached = await client.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (e) {
    console.error("Redis GET error:", e);
  }

  const result = await queryFn();

  try {
    await client.set(key, JSON.stringify(result), { ex: ttlSeconds });
  } catch (e) {
    console.error("Redis SET error:", e);
  }

  return result;
}

/**
 * Invalidate cache entries by exact key.
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (e) {
    console.error("Redis DEL error:", e);
  }
}

/**
 * Invalidate multiple cache entries by pattern using SCAN.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    let cursor: string | number = 0;
    do {
      const result: [string | number, string[]] = await client.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await Promise.all(keys.map((k: string) => client.del(k)));
      }
    } while (cursor !== 0 && cursor !== "0");
  } catch (e) {
    console.error("Redis SCAN/DEL error:", e);
  }
}
