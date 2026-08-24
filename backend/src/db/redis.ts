import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 2) {
        console.warn('⚠️ Redis connection failed. Falling back to in-memory lock/cache.');
        return null;
      }
      return 200;
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisAvailable = true;
    console.log('✅ Connected to Redis successfully');
  }).catch((err: any) => {
    isRedisAvailable = false;
    console.warn('⚠️ Redis not available on host. Using in-memory concurrency locks fallback:', err.message);
  });
} catch (e: any) {
  console.warn('⚠️ Redis initialization error, using in-memory locks fallback:', e.message);
}

// In-memory mutex map fallback for zero-dependency local operation
const inMemoryLocks = new Set<string>();

export async function acquireLock(key: string, ttlMs: number = 5000): Promise<boolean> {
  if (isRedisAvailable && redisClient) {
    try {
      const res = await redisClient.set(`lock:${key}`, 'locked', 'PX', ttlMs, 'NX');
      return res === 'OK';
    } catch {
      // Fallback to in-memory
    }
  }

  if (inMemoryLocks.has(key)) {
    return false;
  }
  inMemoryLocks.add(key);
  setTimeout(() => {
    inMemoryLocks.delete(key);
  }, ttlMs);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(`lock:${key}`);
    } catch {
      // Fallback to in-memory
    }
  }
  inMemoryLocks.delete(key);
}

export { redisClient, isRedisAvailable };
