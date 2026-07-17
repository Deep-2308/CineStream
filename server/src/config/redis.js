import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;

try {
  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Exponential backoff with a cap, but limit max retries to avoid stalling
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('error', (err) => {
    console.warn('[Redis Error]', err.message);
  });
  
  redisClient.on('connect', () => {
    console.log('[Redis] Connected.');
  });
} catch (err) {
  console.warn('[Redis] Failed to initialize:', err.message);
}

/**
 * Graceful cache-aside helper.
 * If Redis is down, it skips cache and runs fetchFn directly.
 */
export const withCache = async (key, ttlSeconds, fetchFn) => {
  if (!redisClient || redisClient.status !== 'ready') {
    return fetchFn();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn(`[Redis GET error for ${key}]:`, err.message);
  }

  const data = await fetchFn();

  try {
    if (redisClient && redisClient.status === 'ready' && data) {
      await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    }
  } catch (err) {
    console.warn(`[Redis SET error for ${key}]:`, err.message);
  }

  return data;
};

export const invalidateCache = async (pattern) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  try {
    let cursor = '0';
    do {
      const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn(`[Redis Invalidate error for pattern ${pattern}]:`, err.message);
  }
};
