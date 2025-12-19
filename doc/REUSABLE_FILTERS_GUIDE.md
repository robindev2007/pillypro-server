# Ultra Reusable Filters & Pagination

Complete examples showing how to use the reusable filter system - no more repetitive code!

## 🎯 Before vs After

### ❌ Before (Repetitive)

```typescript
const getAllUsers = async (req: Request) => {
  const pagination = getPaginationParams(req, { defaultLimit: 10 });
  const filters: FilterOptions = {};

  if (req.query.search) filters.search = req.query.search as string;
  if (req.query.role) filters.role = req.query.role as string;
  if (req.query.isAccountVerified) filters.isAccountVerified = req.query.isAccountVerified === "true";

  const where = buildWhereClause(filters, ["name", "email", "location"]);
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy, skip: pagination.skip, take: pagination.limit, select: {...} }),
    prisma.user.count({ where }),
  ]);

  return createPaginatedResponse(users, total, pagination.page, pagination.limit);
};
```

### ✅ After (One-liner!)

```typescript
const getAllUsers = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.user,
    {
      searchFields: ["name", "email", "location"],
      filterFields: ["role"],
      booleanFields: ["isAccountVerified"],
    },
    { id: true, name: true, email: true, role: true }
  );
};
```

---

## 🚀 Quick Examples

### Example 1: Users List (Already Implemented)

```typescript
// Service
const getAllUsers = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.user,
    {
      searchFields: ["name", "email", "location"],
      filterFields: ["role"],
      booleanFields: ["isAccountVerified"],
      defaultLimit: 10,
      maxLimit: 100,
    },
    {
      id: true,
      email: true,
      name: true,
      profile: true,
      role: true,
      isAccountVerified: true,
      createdAt: true,
    }
  );
};
```

**Supported Queries:**

```bash
GET /users?page=1&limit=20
GET /users?search=john
GET /users?role=USER
GET /users?isAccountVerified=true
GET /users?sortBy=name&sortOrder=asc
GET /users?search=admin&role=SUPER_ADMIN&isAccountVerified=true
```

---

### Example 2: Posts with Categories

```typescript
// Service
const getAllPosts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.post,
    {
      searchFields: ["title", "content", "author"],
      filterFields: ["status", "category"],
      booleanFields: ["isPublished", "isFeatured"],
      dateRangeField: "publishedAt",
      defaultSortBy: "publishedAt",
    },
    {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true,
      status: true,
      isPublished: true,
      publishedAt: true,
    }
  );
};
```

**Supported Queries:**

```bash
GET /posts?search=typescript
GET /posts?category=tutorial&status=published
GET /posts?isPublished=true&isFeatured=true
GET /posts?dateFrom=2024-01-01&dateTo=2024-12-31
GET /posts?search=react&category=tutorial&isPublished=true&sortBy=publishedAt
```

---

### Example 3: Products with Advanced Filters

```typescript
// Service
const getAllProducts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.product,
    {
      searchFields: ["name", "description", "sku"],
      filterFields: ["category", "brand", "status"],
      booleanFields: ["inStock", "isActive", "isFeatured"],
      defaultLimit: 20,
      maxLimit: 50,
    },
    {
      id: true,
      name: true,
      description: true,
      price: true,
      category: true,
      brand: true,
      inStock: true,
      createdAt: true,
    }
  );
};
```

**Supported Queries:**

```bash
GET /products?search=laptop
GET /products?category=electronics&brand=apple
GET /products?inStock=true&isActive=true
GET /products?search=laptop&category=electronics&inStock=true&sortBy=price
```

---

### Example 4: Orders with Date Filtering

```typescript
// Service
const getAllOrders = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.order,
    {
      searchFields: ["orderNumber", "customerName", "customerEmail"],
      filterFields: ["status", "paymentMethod"],
      booleanFields: ["isPaid", "isShipped"],
      dateRangeField: "orderDate",
      defaultSortBy: "orderDate",
      defaultSortOrder: "desc",
    },
    {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      total: true,
      isPaid: true,
      isShipped: true,
      orderDate: true,
    }
  );
};
```

**Supported Queries:**

```bash
GET /orders?dateFrom=2024-01-01&dateTo=2024-01-31
GET /orders?status=delivered&isPaid=true
GET /orders?search=john&status=pending
GET /orders?isShipped=false&sortBy=total&sortOrder=desc
```

---

## 🛠️ Alternative: Manual Control with parseQuery

If you need custom logic but still want automatic parsing:

```typescript
const getAllUsers = async (req: Request) => {
  // Parse query automatically
  const query = parseQuery(req, {
    searchFields: ["name", "email"],
    filterFields: ["role"],
    booleanFields: ["isAccountVerified"],
  });

  // Add custom conditions
  query.where.deletedAt = null;
  query.where.OR?.push({
    phone: {
      contains: query.filters.search,
    },
  });

  // Execute with custom logic
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      ...query.prisma,
      select: { id: true, name: true, email: true },
      include: { profile: true }, // Custom include
    }),
    prisma.user.count({ where: query.where }),
  ]);

  return createPaginatedResponse(
    users,
    total,
    query.pagination.page,
    query.pagination.limit
  );
};
```

---

## 📋 Configuration Options

### QueryConfig Interface

```typescript
interface QueryConfig {
  searchFields?: string[]; // Fields to search across
  filterFields?: string[]; // String fields to filter
  booleanFields?: string[]; // Boolean fields to filter
  dateRangeField?: string; // Field for date range (default: "createdAt")
  defaultLimit?: number; // Default items per page (default: 10)
  maxLimit?: number; // Maximum allowed limit (default: 100)
  defaultSortBy?: string; // Default sort field (default: "createdAt")
  defaultSortOrder?: "asc" | "desc"; // Default sort direction (default: "desc")
}
```

### Examples

```typescript
// Minimal config
{
  searchFields: ["name"]
}

// Full config
{
  searchFields: ["title", "content", "author"],
  filterFields: ["status", "category", "tags"],
  booleanFields: ["isPublished", "isFeatured", "isArchived"],
  dateRangeField: "publishedAt",
  defaultLimit: 20,
  maxLimit: 100,
  defaultSortBy: "publishedAt",
  defaultSortOrder: "desc"
}
```

---

## 🎨 Real-World Complete Example

```typescript
// ============================================================
// posts.service.ts
// ============================================================
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import type { Request } from "express";

const getAllPosts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.post,
    {
      searchFields: ["title", "content"],
      filterFields: ["category", "status"],
      booleanFields: ["isPublished"],
      defaultLimit: 15,
    },
    {
      id: true,
      title: true,
      content: true,
      category: true,
      status: true,
      isPublished: true,
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      createdAt: true,
    }
  );
};

export const PostsService = { getAllPosts };

// ============================================================
// posts.controller.ts
// ============================================================
import { PostsService } from "./posts.service";
import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import httpStatus from "@/constant/httpStatus";

const getAllPosts = handleController(async (req, res) => {
  const result = await PostsService.getAllPosts(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const PostsController = { getAllPosts };

// ============================================================
// posts.route.ts
// ============================================================
import express from "express";
import { PostsController } from "./posts.controller";
import { apiRateLimit } from "@/middleware/rateLimit.middleware";

const router = express.Router();

router.get("/", apiRateLimit, PostsController.getAllPosts);

export default router;
```

**Client Usage:**

```bash
# Get all posts
GET /posts?page=1&limit=20

# Search posts
GET /posts?search=typescript

# Filter by category
GET /posts?category=tutorial

# Filter published posts
GET /posts?isPublished=true

# Combined filters
GET /posts?search=react&category=tutorial&isPublished=true&sortBy=title&sortOrder=asc

# Date range
GET /posts?dateFrom=2024-01-01&dateTo=2024-12-31
```

---

## 🔥 Benefits

✅ **Write 10x less code** - One function call instead of 20+ lines
✅ **Type-safe** - Full TypeScript support
✅ **Consistent** - Same pattern everywhere
✅ **Maintainable** - Change once, apply everywhere
✅ **Flexible** - Easy to extend with custom logic
✅ **Auto-validation** - Built-in parameter validation
✅ **Client-friendly** - Clean, predictable API

---

## 📊 Comparison

| Feature          | Manual Approach    | executePaginatedQuery |
| ---------------- | ------------------ | --------------------- |
| Lines of code    | ~25 lines          | ~15 lines             |
| Type safety      | Manual             | Automatic             |
| Filter parsing   | Manual             | Automatic             |
| Boolean handling | Manual loops       | Declarative           |
| Search fields    | Manual OR building | Declarative array     |
| Pagination       | Manual calculation | Automatic             |
| Response format  | Manual creation    | Automatic             |
| Reusability      | Copy-paste         | Import & configure    |

---

## 🎓 Migration Guide

### Step 1: Replace manual filter extraction

**Before:**

```typescript
const filters: FilterOptions = {};
if (req.query.search) filters.search = req.query.search as string;
if (req.query.role) filters.role = req.query.role as string;
```

**After:**

```typescript
// Automatic in executePaginatedQuery config
```

### Step 2: Replace manual where clause building

**Before:**

```typescript
const where = buildWhereClause(filters, ["name", "email"]);
if (req.query.isActive) {
  where.isActive = req.query.isActive === "true";
}
```

**After:**

```typescript
{
  searchFields: ["name", "email"],
  booleanFields: ["isActive"]
}
```

### Step 3: Replace manual query execution

**Before:**

```typescript
const [items, total] = await Promise.all([
  prisma.model.findMany({ where, orderBy, skip, take }),
  prisma.model.count({ where }),
]);
return createPaginatedResponse(items, total, page, limit);
```

**After:**

```typescript
return executePaginatedQuery(req, prisma.model, config, select);
```

---

## 💡 Pro Tips

1. **Combine with cache middleware** for better performance

```typescript
router.get("/", apiRateLimit, cache("5m"), controller);
```

2. **Add custom validation** if needed

```typescript
const query = parseQuery(req, config);
if (query.filters.role === "SUPER_ADMIN" && !req.user?.isSuperAdmin) {
  throw new AppError(403, "Forbidden");
}
```

3. **Extend with relations**

```typescript
const query = parseQuery(req, config);
const items = await prisma.model.findMany({
  ...query.prisma,
  include: { author: true, comments: true },
});
```

4. **Add virtual filters**

```typescript
const query = parseQuery(req, config);
if (req.query.isExpired === "true") {
  query.where.expiryDate = { lt: new Date() };
}
```
