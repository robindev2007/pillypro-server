# Pagination & Filtering System

A reusable, type-safe pagination and filtering system for easy client-side integration.

## Features

✅ **Type-safe pagination** with configurable defaults
✅ **Multi-field search** across any fields
✅ **Date range filtering** (dateFrom, dateTo)
✅ **Numeric range filtering** (priceRange=0,500)
✅ **Role & status filtering**
✅ **Custom filters** support
✅ **Sorting** (any field, asc/desc)
✅ **Rich metadata** (hasNextPage, hasPreviousPage, totalPages, etc.)
✅ **Reusable helpers** for all endpoints

---

## Quick Start

### 1. Service Layer

```typescript
import {
  getPaginationParams,
  buildWhereClause,
  buildOrderByClause,
  createPaginatedResponse,
} from "@/helpers/pagination";

const getAllUsers = async (req: Request) => {
  // Get pagination params
  const pagination = getPaginationParams(req, {
    defaultLimit: 10,
    maxLimit: 100,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  // Extract filters
  const filters: FilterOptions = {};
  if (req.query.search) filters.search = req.query.search as string;
  if (req.query.role) filters.role = req.query.role as string;

  // Build where clause with searchable fields
  const where = buildWhereClause(filters, ["name", "email", "location"]);

  // Build order by
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  // Query with pagination
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return createPaginatedResponse(
    items,
    total,
    pagination.page,
    pagination.limit
  );
};
```

### 2. Controller Layer

```typescript
const getAllUsers = handleController(async (req, res) => {
  const result = await UsersService.getAllUsers(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});
```

---

## API Usage (Client Side)

### Basic Pagination

```bash
GET /api/users?page=1&limit=20
```

**Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "currentPage": 1,
    "itemsPerPage": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### With Search

```bash
GET /api/users?page=1&limit=10&search=john
```

Searches across specified fields (name, email, location).

### With Sorting

```bash
GET /api/users?sortBy=name&sortOrder=asc
GET /api/users?sortBy=createdAt&sortOrder=desc
```

### With Filters

```bash
# Filter by role
GET /api/users?role=SUPER_ADMIN

# Filter by verification status
GET /api/users?isAccountVerified=true

# Date range
GET /api/users?dateFrom=2024-01-01&dateTo=2024-12-31

# Price range (numeric)
GET /api/services?priceRange=0,500

# Date range filter
GET /api/orders?createdAtRange=2024-01-01,2024-12-31

# Multiple ranges
GET /api/products?priceRange=10,100&stockRange=5,50

# Combined
GET /api/users?page=2&limit=20&search=john&role=USER&sortBy=name&sortOrder=asc
```

---

## Query Parameters

| Parameter           | Type            | Default     | Description                           |
| ------------------- | --------------- | ----------- | ------------------------------------- |
| `page`              | number          | 1           | Current page number (min: 1)          |
| `limit`             | number          | 10          | Items per page (max: 100)             |
| `sortBy`            | string          | "createdAt" | Field to sort by                      |
| `sortOrder`         | "asc" \| "desc" | "desc"      | Sort direction                        |
| `search`            | string          | -           | Search term (multi-field)             |
| `role`              | string          | -           | Filter by role                        |
| `isAccountVerified` | boolean         | -           | Filter by verification status         |
| `dateFrom`          | ISO date        | -           | Start date for range filter           |
| `dateTo`            | ISO date        | -           | End date for range filter             |
| `{field}Range`      | string          | -           | Range filter (e.g., priceRange=0,500) |

---

## Response Structure

```typescript
{
  statusCode: number;
  success: boolean;
  message: string;
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

---

## Helper Functions

### `getPaginationParams(req, options)`

Extracts and validates pagination parameters.

**Options:**

- `defaultLimit`: Default items per page (default: 10)
- `maxLimit`: Maximum allowed limit (default: 100)
- `defaultSortBy`: Default sort field (default: "createdAt")
- `defaultSortOrder`: Default sort direction (default: "desc")

### `getFilterParams(req)`

Extracts filter parameters from query string.

### `buildWhereClause(filters, searchFields)`

Builds Prisma where clause with search support.

**searchFields:** Array of field names to search across (e.g., `["name", "email"]`)

### `buildOrderByClause(sortBy, sortOrder)`

Builds Prisma orderBy clause.

### `createPaginatedResponse(data, total, page, limit)`

Creates standardized paginated response with metadata.

### `getQueryParams(req, options)`

Combined helper that extracts everything at once.

```typescript
const { pagination, filters, where, orderBy } = getQueryParams(req, {
  defaultLimit: 20,
  searchFields: ["name", "email"],
});
```

---

## Frontend Examples

### React with Axios

```typescript
import axios from "axios";

const fetchUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const { data } = await axios.get("/api/users", { params });
  return data;
};

// Usage
const result = await fetchUsers({
  page: 1,
  limit: 20,
  search: "john",
  role: "USER",
  sortBy: "name",
  sortOrder: "asc",
});

console.log(result.data); // users array
console.log(result.meta); // pagination metadata
```

### React Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";

const useUsers = (filters: UsersFilters) => {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => fetchUsers(filters),
  });
};

// Component
function UsersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useUsers({ page, search, limit: 20 });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
      />

      {data?.data.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}

      <Pagination
        current={data?.meta.currentPage}
        total={data?.meta.totalPages}
        onChange={setPage}
        hasNext={data?.meta.hasNextPage}
        hasPrev={data?.meta.hasPreviousPage}
      />
    </div>
  );
}
```

### Vue 3 Composable

```typescript
import { ref, watch } from "vue";

export function useUsers() {
  const users = ref([]);
  const meta = ref(null);
  const loading = ref(false);

  const filters = ref({
    page: 1,
    limit: 20,
    search: "",
    role: "",
  });

  const fetchUsers = async () => {
    loading.value = true;
    try {
      const response = await fetch(
        `/api/users?${new URLSearchParams(filters.value)}`
      );
      const data = await response.json();
      users.value = data.data;
      meta.value = data.meta;
    } finally {
      loading.value = false;
    }
  };

  watch(filters, fetchUsers, { deep: true });

  return { users, meta, loading, filters, fetchUsers };
}
```

---

## Adding to Other Endpoints

### Example: Posts Endpoint

```typescript
// Service
const getAllPosts = async (req: Request) => {
  const pagination = getPaginationParams(req);
  const filters = getFilterParams(req, ["price", "stock"]); // Specify range fields
  const where = buildWhereClause(filters, ["title", "content"]);
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.post.count({ where }),
  ]);

  return createPaginatedResponse(
    posts,
    total,
    pagination.page,
    pagination.limit
  );
};

// Controller
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
```

### Using executePaginatedQuery with Range Filters

```typescript
const getServices = async (req: Request) => {
  return executePaginatedQuery(
    req,
    prisma.businessService,
    {
      searchFields: ["serviceName", "description"],
      filterFields: ["serviceCategory", "serviceSubCategory"],
      rangeFields: ["servicePrice", "duration"], // Enable range filtering
      allowedSortFields: ["serviceName", "servicePrice"],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    },
    {
      id: true,
      serviceName: true,
      servicePrice: true,
      // ... other fields
    }
  );
};
```

Usage:

```bash
GET /api/services?priceRange=50,200&durationRange=30,120
```

---

## Range Filtering

Range filters allow you to filter numeric or date fields by minimum and maximum values using the `{field}Range` parameter.

### Numeric Ranges

```bash
# Filter services by price between 0 and 500
GET /api/services?priceRange=0,500

# Filter products by stock between 10 and 100
GET /api/products?stockRange=10,100

# Multiple ranges
GET /api/products?priceRange=50,200&stockRange=5,50
```

### Date Ranges

```bash
# Filter orders created between two dates
GET /api/orders?createdAtRange=2024-01-01,2024-12-31

# Filter bookings by date range
GET /api/bookings?bookingDateRange=2024-12-01,2024-12-31
```

### Implementation

```typescript
// Service
const getServices = async (req: Request) => {
  const pagination = getPaginationParams(req);
  const filters = getFilterParams(req, ["servicePrice", "duration"]); // Specify range fields
  const where = buildWhereClause(filters, ["serviceName"]);
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  const [services, total] = await Promise.all([
    prisma.businessService.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.businessService.count({ where }),
  ]);

  return createPaginatedResponse(
    services,
    total,
    pagination.page,
    pagination.limit
  );
};
```

### Using with executePaginatedQuery

```typescript
return executePaginatedQuery(
  req,
  prisma.businessService,
  {
    searchFields: ["serviceName"],
    filterFields: ["serviceCategory"],
    rangeFields: ["servicePrice", "duration"], // Enable range filtering
  },
  {
    /* select fields */
  }
);
```

### Frontend Usage

```typescript
// React example
const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });

const { data } = useQuery({
  queryKey: ["services", priceRange],
  queryFn: () =>
    fetchServices({
      priceRange: `${priceRange.min},${priceRange.max}`,
    }),
});

// With range slider
<RangeSlider
  min={0}
  max={1000}
  value={[priceRange.min, priceRange.max]}
  onChange={(values) => setPriceRange({ min: values[0], max: values[1] })}
/>;
```

---

## Custom Filters

Add custom filters by extending the `FilterOptions`:

```typescript
// Extract custom filters
const filters: FilterOptions = {};
if (req.query.search) filters.search = req.query.search as string;
if (req.query.status) filters.status = req.query.status as string;
if (req.query.category) filters.category = req.query.category as string;
if (req.query.isPremium) filters.isPremium = req.query.isPremium === "true";

// Build where clause
const where = buildWhereClause(filters, ["title", "description"]);

// Add manual conditions
where.AND = [{ publishedAt: { not: null } }, { deletedAt: null }];
```

---

## Best Practices

1. **Always set maxLimit** to prevent performance issues
2. **Use meaningful search fields** - only include fields users would search
3. **Index sortable fields** in your database for better performance
4. **Cache results** for frequently accessed pages
5. **Validate sort fields** to prevent sorting by sensitive data
6. **Use debouncing** on client-side search inputs

---

## Performance Tips

```typescript
// Add database indexes
@@index([email])
@@index([name])
@@index([createdAt])
@@index([role, isAccountVerified])

// Use select to limit returned fields
select: {
  id: true,
  name: true,
  email: true,
  // Don't return sensitive fields in list views
}

// Cache count queries for large datasets
const cachedTotal = await cache.get(`users:total:${JSON.stringify(where)}`);
const total = cachedTotal || await prisma.user.count({ where });
```
