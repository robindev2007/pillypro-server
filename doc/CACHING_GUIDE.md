# Caching System Guide

## Overview

Production-ready caching system with Redis (with in-memory fallback). Works exactly like `authorize("ADMIN")` - simple and clean!

## Installation

```bash
bun add ioredis node-cache
bun add --dev @types/node-cache
```

## Configuration

Add to your `.env` file (optional):

```env
# Optional - Falls back to in-memory cache if not provided
REDIS_URL=redis://localhost:6379
```

## Basic Usage - Like authorize()

```typescript
import { cache } from "@/middleware/cache.middleware";

// Just like authorize("ADMIN") - pass duration string
router.get("/products", cache("5m"), getProducts);
router.get("/settings", cache("1h"), getSettings);
router.get("/countries", cache("1d"), getCountries);
```

## Duration Formats

```typescript
cache("30s"); // 30 seconds
cache("5m"); // 5 minutes (default)
cache("15m"); // 15 minutes
cache("1h"); // 1 hour
cache("1d"); // 1 day
cache("1w"); // 1 week
cache(300); // Custom seconds
```

## Complete Examples

### Example 1: E-commerce Routes

```typescript
import { cache, invalidateCache } from "@/middleware/cache.middleware";
import { authorize } from "@/middleware/auth.middleware";

// Public product listing - 5 minutes
router.get("/products", cache("5m"), getProducts);

// Single product - 5 minutes
router.get("/products/:id", cache("5m"), getProduct);

// Categories - 1 hour (stable)
router.get("/categories", cache("1h"), getCategories);

// Create product - invalidate cache
router.post(
  "/products",
  authorize("ADMIN"),
  createProduct,
  invalidateCache(["api:GET:/products:*"])
);

// Update product
router.put(
  "/products/:id",
  authorize("ADMIN"),
  updateProduct,
  invalidateCache(["api:GET:/products:*", "api:GET:/products/:id:*"])
);
```

### Example 2: User Routes

```typescript
import { cache, invalidateUserCache } from "@/middleware/cache.middleware";

// User profile - 5 minutes
router.get("/profile", authorize("LOGGED_IN"), cache("5m"), getProfile);

// Update profile - invalidate cache
router.put(
  "/profile",
  authorize("LOGGED_IN"),
  updateProfile,
  invalidateUserCache("profile")
);

// User orders - 10 minutes
router.get("/orders", authorize("LOGGED_IN"), cache("10m"), getOrders);
```

### Example 3: Blog/CMS Routes

```typescript
import { cache, invalidatePublicCache } from "@/middleware/cache.middleware";

// Blog posts - 1 hour
router.get("/blog", cache("1h"), getBlogPosts);

// Single post - 1 hour
router.get("/blog/:slug", cache("1h"), getBlogPost);

// Static pages - 1 day
router.get("/pages/:slug", cache("1d"), getPage);

// Update post - invalidate
router.put(
  "/blog/:id",
  authorize("ADMIN"),
  updateBlogPost,
  invalidatePublicCache("blog")
);
```

## Cache Invalidation

### After Creating/Updating Data

```typescript
import { invalidateCache } from "@/middleware/cache.middleware";

// Invalidate specific patterns
router.post(
  "/products",
  authorize("ADMIN"),
  createProduct,
  invalidateCache(["api:GET:/products:*"])
);

// Invalidate multiple patterns
router.put(
  "/products/:id",
  authorize("ADMIN"),
  updateProduct,
  invalidateCache(["api:GET:/products:*", "api:GET:/products/:id:*"])
);
```

### Helper Functions

```typescript
import {
  invalidateUserCache,
  invalidatePublicCache,
  invalidateEndpointCache,
} from "@/middleware/cache.middleware";

// Invalidate user cache
router.put(
  "/profile",
  authorize("LOGGED_IN"),
  updateProfile,
  invalidateUserCache("profile")
);

// Invalidate public cache
router.put(
  "/settings",
  authorize("ADMIN"),
  updateSettings,
  invalidatePublicCache("settings")
);

// Invalidate specific endpoint
router.put(
  "/products/:id",
  authorize("ADMIN"),
  updateProduct,
  invalidateEndpointCache("GET", "/products/:id")
);
```

### Manual Invalidation (in Controllers)

```typescript
import { deleteCache, deleteCachePattern } from "@/lib/cache";

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Update in database
  const product = await prisma.product.update({
    where: { id },
    data: req.body,
  });

  // Invalidate cache manually
  await deleteCachePattern("api:GET:/products:*");
  await deleteCache(`api:GET:/products/${id}:*`);

  res.json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
};
```

## Cache Management API

### Admin Endpoints (Protected)

```bash
# Get cache statistics
GET /api/cache/stats
Authorization: Bearer <admin-token>

# Get cache value
GET /api/cache/:key
Authorization: Bearer <admin-token>

# Set cache value
POST /api/cache
Authorization: Bearer <admin-token>
Body: { key: string, value: any, ttl?: number }

# Delete cache key
DELETE /api/cache/:key
Authorization: Bearer <admin-token>

# Delete cache pattern
DELETE /api/cache/pattern/:pattern
Authorization: Bearer <admin-token>

# Flush all cache
DELETE /api/cache
Authorization: Bearer <admin-token>
```

## Direct Cache Usage (Programmatic)

```typescript
import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  flushCache,
} from "@/lib/cache";

// Get from cache
const products = await getCache<Product[]>("products");

// Set cache (5 minutes = 300 seconds)
await setCache("products", products, 300);

// Delete single key
await deleteCache("products");

// Delete pattern (all product keys)
await deleteCachePattern("product:*");

// Flush everything
await flushCache();
```

## Cache Warming

Pre-load cache on server startup:

```typescript
import { warmCache } from "@/middleware/cache.middleware";
import prisma from "@/lib/db";

// In server.ts
async function warmupCache() {
  // Warm popular products
  await warmCache(
    "api:GET:/products/popular:anonymous",
    async () => {
      return await prisma.product.findMany({
        where: { featured: true },
        take: 10,
      });
    },
    3600 // 1 hour
  );

  console.log("Cache warmed successfully");
}

warmupCache();
```

## Response Format

### Cache Hit

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved from cache",
  "data": { "...": "..." },
  "cached": true
}
```

### Cache Miss (Fresh Data)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": { "...": "..." }
}
```

## Preset Durations (Alternative)

```typescript
import {
  cache1Min,
  cache5Min,
  cache15Min,
  cache1Hour,
  cache1Day,
  cache1Week,
} from "@/middleware/cache.middleware";

router.get("/live-prices", cache1Min(), getLivePrices);
router.get("/products", cache5Min(), getProducts);
router.get("/categories", cache15Min(), getCategories);
router.get("/settings", cache1Hour(), getSettings);
router.get("/config", cache1Day(), getConfig);
router.get("/countries", cache1Week(), getCountries);
```

## Performance Tips

### Cache Strategy by Data Type

| Data Type  | Duration         | Example                   |
| ---------- | ---------------- | ------------------------- |
| Live data  | `"1m"`           | Stock prices, live scores |
| User data  | `"5m"`           | Profile, notifications    |
| Products   | `"5m"` - `"15m"` | Product listings          |
| Categories | `"1h"`           | Navigation, filters       |
| Settings   | `"1d"`           | App configuration         |
| Static     | `"1w"`           | Countries, currencies     |

### Best Practices

1. **Always Invalidate After Mutations**

```typescript
router.post(
  "/product",
  createProduct,
  invalidateCache(["api:GET:/products:*"])
);
router.put(
  "/product/:id",
  updateProduct,
  invalidateCache(["api:GET:/products:*"])
);
```

2. **Use Appropriate Durations**

```typescript
// ✅ Good - Short TTL for changing data
router.get("/live-prices", cache("1m"), getLivePrices);

// ❌ Bad - Too long for changing data
router.get("/live-prices", cache("1d"), getLivePrices);
```

3. **Combine with Rate Limiting**

```typescript
import { apiRateLimit } from "@/middleware/rateLimit.middleware";

router.get("/products", apiRateLimit, cache("5m"), getProducts);
```

4. **Correct Middleware Order**

```typescript
// ✅ CORRECT
router.get(
  "/endpoint",
  rateLimit, // 1. Rate limit
  authorize("USER"), // 2. Auth
  cache("5m"), // 3. Cache
  validation, // 4. Validation
  controller // 5. Logic
);
```

## Monitoring & Debugging

Cache logs automatically:

```
[ CACHE ] Using Redis as cache backend
[ CACHE ] MISS - api:GET:/products:anonymous
[ CACHE ] SET - api:GET:/products:anonymous (TTL: 300s)
[ CACHE ] HIT - api:GET:/products:anonymous
[ CACHE ] INVALIDATED - api:GET:/products:*
```

## Troubleshooting

### Cache Not Working?

```typescript
import { isCacheAvailable } from "@/lib/cache";

console.log(isCacheAvailable()); // Check availability
```

### Stale Data?

- Reduce TTL: `cache("1m")` instead of `cache("1h")`
- Add invalidation after updates

### High Memory Usage?

- Add `REDIS_URL` to `.env`
- Redis is more efficient for production

## Production Checklist

- [ ] Set `REDIS_URL` in production environment
- [ ] Test cache hit/miss with logs
- [ ] Add invalidation after all mutations
- [ ] Use appropriate TTLs per endpoint
- [ ] Combine with rate limiting
- [ ] Monitor cache stats via API
- [ ] Warm critical cache on startup

## Quick Reference

```typescript
// Basic usage
cache("5m"); // Like authorize("ADMIN")

// Durations
"30s", "5m", "15m", "1h", "1d", "1w";

// Invalidation
invalidateCache(["pattern:*"]);
invalidateUserCache("resource");
invalidatePublicCache("resource");

// Direct usage
getCache(key);
setCache(key, value, ttl);
deleteCache(key);
deleteCachePattern("pattern:*");
flushCache();
```

Your caching is ready - simple as `authorize()`! 🚀
