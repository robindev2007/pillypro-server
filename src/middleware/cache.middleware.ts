import {
  generateCacheKey,
  getCache,
  isCacheAvailable,
  setCache,
} from "@/lib/cache";
import { logger } from "@/utils/logger";
import { NextFunction, Request, Response } from "express";

// ============================================================
// CACHE MIDDLEWARE - WORKS LIKE authorize("ADMIN")
// ============================================================

/**
 * Cache middleware - pass duration string like authorize()
 * @param duration - "1m", "5m", "15m", "1h", "1d", "1w" or custom seconds
 * @returns Express middleware
 *
 * Usage:
 * router.get("/products", cache("5m"), controller)
 * router.get("/settings", cache("1h"), controller)
 */
export function cache(duration: string | number = "5m") {
  // Parse duration to seconds
  const ttl = typeof duration === "number" ? duration : parseDuration(duration);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Check if caching is available
    if (!isCacheAvailable()) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req);

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        logger.info(`[ CACHE ] HIT - ${cacheKey}`);
        return res.json({
          success: true,
          statusCode: 200,
          message: "Data retrieved from cache",
          data: cachedData,
          cached: true,
        });
      }

      // Cache miss - intercept response
      logger.info(`[ CACHE ] MISS - ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses
        if (
          body &&
          (body.success === true ||
            (body.statusCode >= 200 && body.statusCode < 300))
        ) {
          const dataToCache = body.data || body;

          // Cache the data
          setCache(cacheKey, dataToCache, ttl).catch((err) => {
            logger.error(`[ CACHE ] Error setting cache: ${err.message}`);
          });

          logger.info(`[ CACHE ] SET - ${cacheKey} (TTL: ${ttl}s)`);
        }

        // Call original json method
        return originalJson(body);
      } as any;

      next();
    } catch (error: any) {
      logger.error(`[ CACHE ] Middleware error: ${error.message}`);
      next(); // Continue without caching on error
    }
  };
}

// ============================================================
// DURATION PARSER
// ============================================================

/**
 * Parse duration string to seconds
 * @param duration - "1m", "5m", "15m", "1h", "1d", "1w"
 */
function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) {
    logger.warning(`[ CACHE ] Invalid duration format: ${duration}, using 5m`);
    return 300; // Default 5 minutes
  }

  const value = parseInt(match[1] ?? "10");
  const unit = match[2];
  return value * (units[unit as keyof typeof units] || 10);
}

// ============================================================
// PRESET DURATIONS (FOR BACKWARD COMPATIBILITY)
// ============================================================

/**
 * Cache for 1 minute - for frequently changing data
 */
export const cache1Min = () => cache("1m");

/**
 * Cache for 5 minutes - default for most endpoints
 */
export const cache5Min = () => cache("5m");

/**
 * Cache for 15 minutes - for moderately stable data
 */
export const cache15Min = () => cache("15m");

/**
 * Cache for 1 hour - for stable data
 */
export const cache1Hour = () => cache("1h");

/**
 * Cache for 1 day - for very stable data (e.g., public settings)
 */
export const cache1Day = () => cache("1d");

/**
 * Cache for 1 week - for static content
 */
export const cache1Week = () => cache("1w");

// ============================================================
// CACHE INVALIDATION MIDDLEWARE
// ============================================================

/**
 * Invalidate cache after mutation (POST, PUT, PATCH, DELETE)
 * Use this after controllers that modify data
 */
export function invalidateCache(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after response
    res.json = function (body: any) {
      // Only invalidate on successful responses
      if (
        body &&
        (body.success === true ||
          (body.statusCode >= 200 && body.statusCode < 300))
      ) {
        // Invalidate cache patterns
        const { deleteCache, deleteCachePattern } = require("@/lib/cache");

        patterns.forEach((pattern) => {
          if (pattern.includes("*")) {
            deleteCachePattern(pattern).catch((err: any) => {
              logger.error(
                `[ CACHE ] Error deleting pattern ${pattern}: ${err.message}`
              );
            });
          } else {
            deleteCache(pattern).catch((err: any) => {
              logger.error(
                `[ CACHE ] Error deleting key ${pattern}: ${err.message}`
              );
            });
          }
        });

        logger.info(`[ CACHE ] INVALIDATED - ${patterns.join(", ")}`);
      }

      // Call original json method
      return originalJson(body);
    } as any;

    next();
  };
}

/**
 * Invalidate user-specific cache
 */
export function invalidateUserCache(resource?: string) {
  return invalidateCache([`user:${resource || "*"}:*`]);
}

/**
 * Invalidate public cache
 */
export function invalidatePublicCache(resource?: string) {
  return invalidateCache([`public:${resource || "*"}:*`]);
}

/**
 * Invalidate all cache for a specific endpoint
 */
export function invalidateEndpointCache(method: string, path: string) {
  return invalidateCache([`api:${method}:${path}:*`]);
}

// ============================================================
// CACHE WARMING UTILITY
// ============================================================

/**
 * Warm up cache by pre-fetching data
 * Use in background jobs or on server startup
 */
export async function warmCache(
  key: string,
  dataFetcher: () => Promise<any>,
  ttl: number = 300
): Promise<void> {
  try {
    logger.info(`[ CACHE ] WARMING - ${key}`);
    const data = await dataFetcher();
    await setCache(key, data, ttl);
    logger.info(`[ CACHE ] WARMED - ${key}`);
  } catch (error: any) {
    logger.error(`[ CACHE ] Error warming cache for ${key}: ${error.message}`);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  cache,
  cache1Min,
  cache5Min,
  cache15Min,
  cache1Hour,
  cache1Day,
  cache1Week,
  invalidateCache,
  invalidateUserCache,
  invalidatePublicCache,
  invalidateEndpointCache,
  warmCache,
};
