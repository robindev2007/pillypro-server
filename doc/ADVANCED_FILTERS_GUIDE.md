# Advanced Filters & Multiple Sort Guide

Complete guide for advanced filtering, multiple sorting, and complex query conditions.

---

## 🔥 Advanced Features

### 1. **Multiple Sort Fields**

Sort by multiple fields with individual sort orders.

**Query Format:**

```bash
?sortBy=field1,field2,field3&sortOrder=asc,desc,asc
```

**Examples:**

```bash
# Sort by name ascending, then createdAt descending
GET /users?sortBy=name,createdAt&sortOrder=asc,desc

# Sort by priority desc, then status asc, then date desc
GET /tasks?sortBy=priority,status,createdAt&sortOrder=desc,asc,desc

# Sort by price ascending
GET /products?sortBy=price&sortOrder=asc
```

**Service Implementation:**

```typescript
const getAllProducts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.product,
    {
      searchFields: ["name", "description"],
      filterFields: ["category", "brand"],
      allowedSortFields: ["name", "price", "createdAt", "rating"],
      defaultSortBy: ["createdAt", "name"],
      defaultSortOrder: ["desc", "asc"],
    },
    {
      id: true,
      name: true,
      price: true,
      category: true,
      createdAt: true,
    }
  );
};
```

---

### 2. **Advanced Filter Operators**

Use powerful operators for precise filtering.

**Supported Operators:**

- `eq` - Equal to
- `ne` - Not equal to
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `in` - In array
- `notIn` - Not in array
- `contains` - Contains text
- `startsWith` - Starts with text
- `endsWith` - Ends with text

**Query Format:**

```bash
?field[operator]=value
```

**Examples:**

```bash
# Price range
GET /products?price[gte]=100&price[lte]=500

# Not equal to status
GET /orders?status[ne]=cancelled

# Multiple values (IN)
GET /users?role[in]=USER,ADMIN

# Exclude multiple values (NOT IN)
GET /posts?status[notIn]=draft,archived

# Text contains (case-insensitive)
GET /products?name[contains]=laptop

# Starts with
GET /users?email[startsWith]=admin

# Ends with
GET /files?filename[endsWith]=.pdf

# Greater than
GET /products?stock[gt]=0

# Less than or equal
GET /tasks?priority[lte]=3
```

**Combined Example:**

```bash
GET /products?price[gte]=100&price[lte]=1000&category[in]=electronics,computers&stock[gt]=0&sortBy=price,rating&sortOrder=asc,desc
```

---

### 3. **Number Field Filters**

Auto-parse number fields with type safety.

**Configuration:**

```typescript
const getAllProducts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.product,
    {
      numberFields: ["price", "stock", "rating", "discount"],
      filterFields: ["category", "brand"],
      searchFields: ["name", "description"],
    },
    select
  );
};
```

**Usage:**

```bash
# Direct number filters
GET /products?price=299&stock=10

# With operators for ranges
GET /products?price[gte]=100&price[lte]=500&stock[gt]=0

# Multiple number conditions
GET /products?rating=5&price[lt]=1000
```

---

### 4. **Date Field Filters**

Advanced date filtering with specific dates or ranges.

**Configuration:**

```typescript
const getAllOrders = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.order,
    {
      dateFields: ["orderDate", "shippedDate", "deliveredDate"],
      dateRangeField: "orderDate", // For dateFrom/dateTo
      filterFields: ["status"],
    },
    select
  );
};
```

**Usage:**

```bash
# Date range (using dateFrom/dateTo)
GET /orders?dateFrom=2024-01-01&dateTo=2024-12-31

# Specific date
GET /orders?orderDate=2024-06-15

# Date with operators
GET /orders?orderDate[gte]=2024-01-01&orderDate[lte]=2024-12-31

# Multiple date fields
GET /orders?orderDate[gte]=2024-01-01&shippedDate[ne]=null
```

---

### 5. **Custom Filters**

Add complex custom logic that standard filters can't handle.

**Example: Role-based Filtering**

```typescript
const getAllPosts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.post,
    {
      searchFields: ["title", "content"],
      filterFields: ["category", "status"],
      booleanFields: ["isFeatured"],
      customFilters: (req, where) => {
        // Non-admins can only see published posts
        if (req.user?.role !== "SUPER_ADMIN") {
          where.status = "published";
          where.isPublic = true;
        }

        // Add soft delete filter
        where.deletedAt = null;
      },
    },
    select
  );
};
```

**Example: Complex Relations**

```typescript
const getAllProducts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.product,
    {
      searchFields: ["name", "sku"],
      filterFields: ["category"],
      numberFields: ["price"],
      customFilters: (req, where) => {
        // Filter by seller
        if (req.query.sellerId) {
          where.seller = {
            id: req.query.sellerId as string,
          };
        }

        // Filter by tag
        if (req.query.tag) {
          where.tags = {
            some: {
              name: req.query.tag as string,
            },
          };
        }

        // Price range with discount
        if (req.query.maxPrice) {
          where.OR = [
            { price: { lte: Number(req.query.maxPrice) } },
            {
              AND: [
                { discount: { gt: 0 } },
                {
                  price: {
                    lte: Number(req.query.maxPrice) * 1.2,
                  },
                },
              ],
            },
          ];
        }
      },
    },
    select
  );
};
```

**Usage:**

```bash
GET /products?sellerId=123&tag=electronics&maxPrice=500
```

---

### 6. **Comma-Separated Values (IN Query)**

Automatically converts comma-separated values to IN queries.

**Configuration:**

```typescript
const getAllUsers = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.user,
    {
      filterFields: ["role", "status", "location"],
      searchFields: ["name", "email"],
    },
    select
  );
};
```

**Usage:**

```bash
# Single role
GET /users?role=USER

# Multiple roles (automatic IN query)
GET /users?role=USER,ADMIN,MODERATOR

# Multiple statuses
GET /users?status=active,pending

# Multiple locations
GET /users?location=US,UK,CA
```

**Generated Prisma Query:**

```typescript
{
  where: {
    role: { in: ["USER", "ADMIN", "MODERATOR"] }
  }
}
```

---

## 🎯 Real-World Advanced Examples

### Example 1: E-commerce Products

```typescript
const getAllProducts = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.product,
    {
      searchFields: ["name", "description", "sku"],
      filterFields: ["category", "brand", "status"],
      booleanFields: ["inStock", "isFeatured", "isOnSale"],
      numberFields: ["price", "rating", "stock"],
      dateFields: ["createdAt", "lastRestockedAt"],
      allowedSortFields: ["name", "price", "rating", "createdAt", "sales"],
      defaultSortBy: ["isFeatured", "rating", "createdAt"],
      defaultSortOrder: ["desc", "desc", "desc"],
      customFilters: (req, where) => {
        // Only show active products
        where.deletedAt = null;

        // Filter by price range with discount
        if (req.query.minPrice || req.query.maxPrice) {
          where.finalPrice = {};
          if (req.query.minPrice) {
            where.finalPrice.gte = Number(req.query.minPrice);
          }
          if (req.query.maxPrice) {
            where.finalPrice.lte = Number(req.query.maxPrice);
          }
        }
      },
    },
    {
      id: true,
      name: true,
      price: true,
      finalPrice: true,
      category: true,
      brand: true,
      rating: true,
      inStock: true,
      isFeatured: true,
    }
  );
};
```

**Query Examples:**

```bash
# Basic search
GET /products?search=laptop

# Filter by category and brand
GET /products?category=electronics&brand[in]=apple,samsung,dell

# Price range
GET /products?price[gte]=500&price[lte]=2000

# In stock only, sort by price
GET /products?inStock=true&sortBy=price&sortOrder=asc

# Featured products, high rating
GET /products?isFeatured=true&rating[gte]=4

# Complex multi-filter
GET /products?search=gaming&category=electronics&price[gte]=1000&price[lte]=3000&inStock=true&rating[gte]=4&sortBy=rating,price&sortOrder=desc,asc

# On sale items
GET /products?isOnSale=true&sortBy=discount,price&sortOrder=desc,asc
```

---

### Example 2: Order Management

```typescript
const getAllOrders = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.order,
    {
      searchFields: ["orderNumber", "customerName", "customerEmail"],
      filterFields: ["status", "paymentMethod", "shippingMethod"],
      booleanFields: ["isPaid", "isShipped", "isDelivered"],
      numberFields: ["total", "discount"],
      dateFields: ["orderDate", "paidAt", "shippedAt", "deliveredAt"],
      dateRangeField: "orderDate",
      allowedSortFields: ["orderDate", "total", "status"],
      defaultSortBy: ["orderDate"],
      defaultSortOrder: ["desc"],
      customFilters: (req, where) => {
        // Role-based filtering
        if (req.user?.role === "SELLER") {
          where.sellerId = req.user.userId;
        }

        // Late orders
        if (req.query.isLate === "true") {
          where.expectedDeliveryDate = {
            lt: new Date(),
          };
          where.isDelivered = false;
        }
      },
    },
    {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      isPaid: true,
      isShipped: true,
      orderDate: true,
    }
  );
};
```

**Query Examples:**

```bash
# Recent orders
GET /orders?sortBy=orderDate&sortOrder=desc

# Unpaid orders
GET /orders?isPaid=false

# Orders by date range and status
GET /orders?dateFrom=2024-01-01&dateTo=2024-12-31&status[in]=pending,processing

# High-value orders
GET /orders?total[gte]=1000&sortBy=total&sortOrder=desc

# Complex filter
GET /orders?status=processing&isPaid=true&isShipped=false&dateFrom=2024-01-01&sortBy=orderDate,total&sortOrder=desc,desc
```

---

### Example 3: User Analytics

```typescript
const getUserAnalytics = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.user,
    {
      searchFields: ["name", "email", "phone"],
      filterFields: ["role", "status", "country"],
      booleanFields: ["isAccountVerified", "isEmailVerified", "isActive"],
      numberFields: ["age", "loginCount"],
      dateFields: ["lastLoginAt", "createdAt"],
      dateRangeField: "createdAt",
      allowedSortFields: ["name", "createdAt", "lastLoginAt", "loginCount"],
      defaultSortBy: ["createdAt"],
      customFilters: (req, where) => {
        // Active users only
        if (req.query.activeOnly === "true") {
          where.lastLoginAt = {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          };
        }

        // New users
        if (req.query.newUsers === "true") {
          where.createdAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          };
        }
      },
    },
    select
  );
};
```

**Query Examples:**

```bash
# Active verified users
GET /users?isAccountVerified=true&activeOnly=true

# New users this week
GET /users?newUsers=true&sortBy=createdAt&sortOrder=desc

# Users by role and country
GET /users?role[in]=USER,PREMIUM&country[in]=US,UK,CA

# Engaged users
GET /users?loginCount[gte]=10&sortBy=loginCount&sortOrder=desc

# Age range filter
GET /users?age[gte]=18&age[lte]=65
```

---

## 📋 Quick Reference

### Query Parameters Summary

| Parameter         | Format                         | Example                                 |
| ----------------- | ------------------------------ | --------------------------------------- |
| **Multiple Sort** | `sortBy=f1,f2&sortOrder=o1,o2` | `sortBy=name,date&sortOrder=asc,desc`   |
| **Operators**     | `field[op]=value`              | `price[gte]=100&price[lte]=500`         |
| **IN Query**      | `field=v1,v2,v3`               | `role=USER,ADMIN`                       |
| **Search**        | `search=term`                  | `search=john`                           |
| **Boolean**       | `field=true/false`             | `isActive=true`                         |
| **Number**        | `field=number`                 | `age=25`                                |
| **Date**          | `field=ISO8601`                | `date=2024-01-01`                       |
| **Date Range**    | `dateFrom=...&dateTo=...`      | `dateFrom=2024-01-01&dateTo=2024-12-31` |

### Config Options Summary

```typescript
{
  // Search
  searchFields: ["field1", "field2"],

  // Filters
  filterFields: ["stringField1", "stringField2"],
  booleanFields: ["boolField1", "boolField2"],
  numberFields: ["numField1", "numField2"],
  dateFields: ["dateField1", "dateField2"],

  // Sorting
  defaultSortBy: ["field1", "field2"],
  defaultSortOrder: ["desc", "asc"],
  allowedSortFields: ["field1", "field2", "field3"],

  // Pagination
  defaultLimit: 20,
  maxLimit: 100,

  // Date range
  dateRangeField: "createdAt",

  // Custom logic
  customFilters: (req, where) => {
    // Your custom filter logic
  }
}
```

---

## 🎨 Frontend Integration

### React Example with All Features

```typescript
import { useState } from "react";
import axios from "axios";

interface Filters {
  search?: string;
  page: number;
  limit: number;
  sortBy?: string[];
  sortOrder?: ("asc" | "desc")[];
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  rating?: number;
}

function ProductList() {
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
    sortBy: ["rating", "price"],
    sortOrder: ["desc", "asc"],
  });

  const fetchProducts = async () => {
    const params: any = {
      page: filters.page,
      limit: filters.limit,
    };

    // Multiple sort
    if (filters.sortBy) {
      params.sortBy = filters.sortBy.join(",");
      params.sortOrder = filters.sortOrder?.join(",");
    }

    // Search
    if (filters.search) {
      params.search = filters.search;
    }

    // Advanced filters
    if (filters.category) {
      params.category = filters.category;
    }

    if (filters.priceMin) {
      params["price[gte]"] = filters.priceMin;
    }

    if (filters.priceMax) {
      params["price[lte]"] = filters.priceMax;
    }

    if (filters.inStock !== undefined) {
      params.inStock = filters.inStock;
    }

    if (filters.rating) {
      params["rating[gte]"] = filters.rating;
    }

    const { data } = await axios.get("/api/products", { params });
    return data;
  };

  // ... rest of component
}
```

---

## 💡 Best Practices

1. **Always set `allowedSortFields`** to prevent sorting by sensitive data
2. **Use `customFilters` for complex logic** instead of hacking query params
3. **Validate operator inputs** if accepting user-defined operators
4. **Index database fields** used in sorting and filtering
5. **Cache expensive queries** with appropriate TTL
6. **Limit maximum items** with `maxLimit` to prevent performance issues
7. **Use date operators** instead of exact date matches for better UX
8. **Combine with rate limiting** to prevent abuse

---

This system now supports virtually any filtering scenario you'll encounter! 🚀
