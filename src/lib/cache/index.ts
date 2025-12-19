import { logger } from "@/utils/logger";
import Redis from "ioredis";
import NodeCache from "node-cache";

// ============================================================
// CACHE CLIENT - REDIS WITH IN-MEMORY FALLBACK
// ============================================================

type CacheClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  flush: () => Promise<void>;
  type: "redis" | "memory";
};

let cacheClient: CacheClient;
let redisClient: Redis | null = null;
let memoryCache: NodeCache | null = null;

// ---------------- REDIS CLIENT ----------------
function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info("[ CACHE ] No REDIS_URL found, using in-memory cache");
    return null;
  }

  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      logger.error(`[ CACHE ] Redis error: ${err.message}`);
    });

    redis.on("connect", () => {
      logger.info("[ CACHE ] Connected to Redis successfully");
    });

    redis.on("close", () => {
      logger.warning("[ CACHE ] Redis connection closed");
    });

    // Test connection
    redis.connect().catch((err) => {
      logger.error(`[ CACHE ] Failed to connect to Redis: ${err.message}`);
      logger.info("[ CACHE ] Falling back to in-memory cache");
      redis.disconnect();
    });

    return redis;
  } catch (error: any) {
    logger.error(`[ CACHE ] Redis initialization error: ${error.message}`);
    return null;
  }
}

// ---------------- IN-MEMORY CLIENT ----------------
function createMemoryClient(): NodeCache {
  return new NodeCache({
    stdTTL: 300, // 5 minutes default
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false, // Don't clone objects (better performance)
  });
}

// ---------------- INITIALIZE CACHE CLIENT ----------------
function initializeCacheClient(): CacheClient {
  redisClient = createRedisClient();

  if (redisClient && redisClient.status === "ready") {
    logger.info("[ CACHE ] Using Redis as cache backend");
    return {
      type: "redis",
      get: async (key: string) => {
        try {
          return await redisClient!.get(key);
        } catch (error: any) {
          logger.error(`[ CACHE ] Redis GET error: ${error.message}`);
          return null;
        }
      },
      set: async (key: string, value: string, ttl?: number) => {
        try {
          if (ttl) {
            await redisClient!.setex(key, ttl, value);
          } else {
            await redisClient!.set(key, value);
          }
        } catch (error: any) {
          logger.error(`[ CACHE ] Redis SET error: ${error.message}`);
        }
      },
      del: async (key: string) => {
        try {
          await redisClient!.del(key);
        } catch (error: any) {
          logger.error(`[ CACHE ] Redis DEL error: ${error.message}`);
        }
      },
      flush: async () => {
        try {
          await redisClient!.flushdb();
          logger.info("[ CACHE ] Redis cache flushed");
        } catch (error: any) {
          logger.error(`[ CACHE ] Redis FLUSH error: ${error.message}`);
        }
      },
    };
  }

  // Fallback to in-memory cache
  memoryCache = createMemoryClient();
  logger.info("[ CACHE ] Using in-memory cache as backend");

  return {
    type: "memory",
    get: async (key: string) => {
      const value = memoryCache!.get<string>(key);
      return value ?? null;
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) {
        memoryCache!.set(key, value, ttl);
      } else {
        memoryCache!.set(key, value);
      }
    },
    del: async (key: string) => {
      memoryCache!.del(key);
    },
    flush: async () => {
      memoryCache!.flushAll();
      logger.info("[ CACHE ] In-memory cache flushed");
    },
  };
}

// Initialize on module load
cacheClient = initializeCacheClient();

// ---------------- GRACEFUL SHUTDOWN ----------------
process.on("SIGINT", async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info("[ CACHE ] Redis connection closed");
  }
});

process.on("SIGTERM", async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info("[ CACHE ] Redis connection closed");
  }
});

// ============================================================
// CACHE UTILITIES
// ============================================================

/**
 * Get value from cache
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const value = await cacheClient.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error: any) {
    logger.error(
      `[ CACHE ] Error getting cache for key ${key}: ${error.message}`
    );
    return null;
  }
}

/**
 * Set value in cache
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds
 */
export async function setCache(
  key: string,
  value: any,
  ttl?: number
): Promise<void> {
  try {
    const stringValue = JSON.stringify(value);
    await cacheClient.set(key, stringValue, ttl);
  } catch (error: any) {
    logger.error(
      `[ CACHE ] Error setting cache for key ${key}: ${error.message}`
    );
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await cacheClient.del(key);
  } catch (error: any) {
    logger.error(
      `[ CACHE ] Error deleting cache for key ${key}: ${error.message}`
    );
  }
}

/**
 * Delete multiple keys from cache
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (cacheClient.type === "redis" && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(
          `[ CACHE ] Deleted ${keys.length} keys matching pattern: ${pattern}`
        );
      }
    } else if (cacheClient.type === "memory" && memoryCache) {
      const keys = memoryCache.keys();
      const matchingKeys = keys.filter((key) => {
        const regex = new RegExp(pattern.replace("*", ".*"));
        return regex.test(key);
      });
      if (matchingKeys.length > 0) {
        memoryCache.del(matchingKeys);
        logger.info(
          `[ CACHE ] Deleted ${matchingKeys.length} keys matching pattern: ${pattern}`
        );
      }
    }
  } catch (error: any) {
    logger.error(
      `[ CACHE ] Error deleting cache pattern ${pattern}: ${error.message}`
    );
  }
}

/**
 * Flush all cache
 */
export async function flushCache(): Promise<void> {
  try {
    await cacheClient.flush();
  } catch (error: any) {
    logger.error(`[ CACHE ] Error flushing cache: ${error.message}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  if (cacheClient.type === "memory" && memoryCache) {
    return {
      type: "memory",
      keys: memoryCache.keys().length,
      stats: memoryCache.getStats(),
    };
  }

  return {
    type: "redis",
    keys: "N/A (use Redis CLI)",
    stats: "N/A (use Redis CLI)",
  };
}

/**
 * Check if cache is available
 */
export function isCacheAvailable(): boolean {
  if (cacheClient.type === "redis" && redisClient) {
    return redisClient.status === "ready";
  }
  return cacheClient.type === "memory";
}

// ============================================================
// CACHE KEY GENERATORS
// ============================================================

/**
 * Generate cache key for API endpoints
 */
export function generateCacheKey(req: any): string {
  const method = req.method;
  const path = req.originalUrl || req.url;
  const userId = req.user?.userId || "anonymous";

  return `api:${method}:${path}:${userId}`;
}

/**
 * Generate cache key for user-specific data
 */
export function generateUserCacheKey(userId: string, resource: string): string {
  return `user:${userId}:${resource}`;
}

/**
 * Generate cache key for public data
 */
export function generatePublicCacheKey(
  resource: string,
  params?: string
): string {
  if (params) {
    return `public:${resource}:${params}`;
  }
  return `public:${resource}`;
}

// ============================================================
// EXPORTS
// ============================================================

export { cacheClient };
export default {
  get: getCache,
  set: setCache,
  delete: deleteCache,
  deletePattern: deleteCachePattern,
  flush: flushCache,
  stats: getCacheStats,
  isAvailable: isCacheAvailable,
  generateKey: generateCacheKey,
  generateUserKey: generateUserCacheKey,
  generatePublicKey: generatePublicCacheKey,
};
