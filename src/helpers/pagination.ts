import type { Request } from "express";

// ============================================================
// TYPES
// ============================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string | string[];
  sortOrder: "asc" | "desc" | ("asc" | "desc")[];
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  role?: string;
  ranges?: Record<string, { min: number | Date; max: number | Date }>;
  [key: string]: any;
}

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith";

export interface AdvancedFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface QueryConfig {
  searchFields?: string[];
  filterFields?: string[];
  booleanFields?: string[];
  numberFields?: string[];
  dateFields?: string[];
  dateRangeField?: string;
  rangeFields?: string[]; // Fields that support range filtering
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string | string[];
  defaultSortOrder?: "asc" | "desc" | ("asc" | "desc")[];
  allowedSortFields?: string[];
  customFilters?: (req: Request, where: any) => void;
}

export interface ParsedQuery {
  pagination: PaginationParams;
  where: any;
  orderBy: any;
  filters: FilterOptions;
}

// ============================================================
// PAGINATION HELPER
// ============================================================

/**
 * Extract and validate pagination parameters from request
 * Supports multiple sortBy fields: ?sortBy=name,createdAt&sortOrder=asc,desc
 * @param req Express Request object
 * @param options Default options
 */
export const getPaginationParams = (
  req: Request,
  options: {
    defaultLimit?: number;
    maxLimit?: number;
    defaultSortBy?: string | string[];
    defaultSortOrder?: "asc" | "desc" | ("asc" | "desc")[];
    allowedSortFields?: string[];
  } = {}
): PaginationParams => {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy = "createdAt",
    defaultSortOrder = "desc",
    allowedSortFields = [],
  } = options;

  // Extract query parameters
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(req.query.limit as string) || defaultLimit)
  );

  // Handle multiple sortBy
  let sortBy: string | string[];
  let sortOrder: "asc" | "desc" | ("asc" | "desc")[];

  if (req.query.sortBy) {
    const sortByString = req.query.sortBy as string;
    const sortFields = sortByString.includes(",")
      ? sortByString.split(",").map((s) => s.trim())
      : sortByString;

    // Validate against allowed fields if provided
    if (allowedSortFields.length > 0) {
      const fields = Array.isArray(sortFields) ? sortFields : [sortFields];
      const invalidFields = fields.filter(
        (f) => !allowedSortFields.includes(f)
      );
      if (invalidFields.length > 0) {
        sortBy = defaultSortBy;
      } else {
        sortBy = sortFields;
      }
    } else {
      sortBy = sortFields;
    }
  } else {
    sortBy = defaultSortBy;
  }

  // Handle multiple sortOrder
  if (req.query.sortOrder) {
    const sortOrderString = req.query.sortOrder as string;
    if (sortOrderString.includes(",")) {
      sortOrder = sortOrderString
        .split(",")
        .map((s) => s.trim() as "asc" | "desc");
    } else {
      sortOrder = sortOrderString as "asc" | "desc";
    }
  } else {
    sortOrder = defaultSortOrder;
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  return {
    data,
    meta: getPaginationMeta(total, page, limit),
  };
};

// ============================================================
// FILTER HELPER
// ============================================================

/**
 * Extract filter parameters from request
 * Supports range parameters: priceRange=0,500 or dateRange=2024-01-01,2024-12-31
 */
export const getFilterParams = (
  req: Request,
  rangeFields: string[] = []
): FilterOptions => {
  const filters: FilterOptions = {};
  const ranges: Record<string, { min: number | Date; max: number | Date }> = {};

  // Search
  if (req.query.search) {
    filters.search = req.query.search as string;
  }

  // Date range
  if (req.query.dateFrom) {
    filters.dateFrom = new Date(req.query.dateFrom as string);
  }
  if (req.query.dateTo) {
    filters.dateTo = new Date(req.query.dateTo as string);
  }

  // Status
  if (req.query.status) {
    filters.status = req.query.status as string;
  }

  // Role
  if (req.query.role) {
    filters.role = req.query.role as string;
  }

  // Parse range parameters (e.g., priceRange=0,500)
  rangeFields.forEach((field) => {
    const rangeParam = req.query[`${field}Range`] as string;
    if (rangeParam) {
      const [minStr, maxStr] = rangeParam.split(",").map((s) => s.trim());
      if (minStr && maxStr) {
        // Try to parse as number first, then as date
        const minNum = parseFloat(minStr);
        const maxNum = parseFloat(maxStr);

        if (!isNaN(minNum) && !isNaN(maxNum)) {
          ranges[field] = { min: minNum, max: maxNum };
        } else {
          // Try as date
          const minDate = new Date(minStr);
          const maxDate = new Date(maxStr);
          if (!isNaN(minDate.getTime()) && !isNaN(maxDate.getTime())) {
            ranges[field] = { min: minDate, max: maxDate };
          }
        }
      }
    }
  });

  if (Object.keys(ranges).length > 0) {
    filters.ranges = ranges;
  }

  // Custom filters - any other query params
  Object.keys(req.query).forEach((key) => {
    if (
      ![
        "page",
        "limit",
        "sortBy",
        "sortOrder",
        "search",
        "dateFrom",
        "dateTo",
        "status",
        "role",
        ...rangeFields.map((f) => `${f}Range`),
      ].includes(key)
    ) {
      filters[key] = req.query[key];
    }
  });

  return filters;
};

/**
 * Build Prisma where clause from filters
 * Supports range filters for numeric and date fields
 */
export const buildWhereClause = (
  filters: FilterOptions,
  searchFields: string[] = []
) => {
  const where: any = {};

  // Search across multiple fields
  if (filters.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => ({
      [field]: {
        contains: filters.search,
        mode: "insensitive",
      },
    }));
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.dateTo.lte = filters.dateTo;
    }
  }

  // Range filters (e.g., price: { gte: 0, lte: 500 })
  if (filters.ranges) {
    Object.entries(filters.ranges).forEach(([field, range]) => {
      where[field] = {
        gte: range.min,
        lte: range.max,
      };
    });
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status;
  }

  // Role filter
  if (filters.role) {
    where.role = filters.role;
  }

  // Add custom filters
  Object.keys(filters).forEach((key) => {
    if (
      ![
        "search",
        "dateFrom",
        "dateTo",
        "status",
        "role",
        "searchFields",
        "ranges",
      ].includes(key)
    ) {
      where[key] = filters[key];
    }
  });

  return where;
};

/**
 * Build Prisma orderBy clause
 * Supports multiple fields: buildOrderByClause(['name', 'createdAt'], ['asc', 'desc'])
 * Supports nested fields: buildOrderByClause('user.name', 'asc')
 */
export const buildOrderByClause = (
  sortBy: string | string[],
  sortOrder: "asc" | "desc" | ("asc" | "desc")[]
) => {
  // Single field sort
  if (typeof sortBy === "string") {
    const order = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;

    // Handle nested fields (e.g., "user.name")
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      let result: any = {};
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]!] = {};
        current = current[parts[i]!];
      }
      current[parts[parts.length - 1]!] = order;

      return result;
    }

    return { [sortBy]: order };
  }

  // Multiple fields sort
  return sortBy.map((field, index) => {
    const order = Array.isArray(sortOrder)
      ? sortOrder[index] || sortOrder[0] || "desc"
      : sortOrder;

    // Handle nested fields
    if (field.includes(".")) {
      const parts = field.split(".");
      let result: any = {};
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]!] = {};
        current = current[parts[i]!];
      }
      current[parts[parts.length - 1]!] = order;

      return result;
    }

    return { [field]: order };
  });
};

// ============================================================
// COMBINED HELPER
// ============================================================

/**
 * Extract all query parameters (pagination + filters)
 */
export const getQueryParams = (
  req: Request,
  options: {
    defaultLimit?: number;
    maxLimit?: number;
    defaultSortBy?: string;
    defaultSortOrder?: "asc" | "desc";
    searchFields?: string[];
    rangeFields?: string[];
  } = {}
) => {
  const { searchFields = [], rangeFields = [], ...paginationOptions } = options;

  const pagination = getPaginationParams(req, paginationOptions);
  const filters = getFilterParams(req, rangeFields);
  const where = buildWhereClause(filters, searchFields);
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  return {
    pagination,
    filters,
    where,
    orderBy,
  };
};

// ============================================================
// ULTRA REUSABLE QUERY BUILDER
// ============================================================

/**
 * Parse advanced filter from query string
 * Supports operators: eq, ne, gt, gte, lt, lte, in, notIn, contains, startsWith, endsWith
 * Format: ?field[operator]=value
 * Examples:
 *   ?price[gte]=100&price[lte]=500
 *   ?status[in]=active,pending
 *   ?name[contains]=john
 */
export const parseAdvancedFilters = (req: Request): Record<string, any> => {
  const where: any = {};

  Object.keys(req.query).forEach((key) => {
    // Match pattern: field[operator]
    const match = key.match(/^(.+)\[(.+)\]$/);
    if (match && match[1] && match[2]) {
      const field = match[1];
      const operator = match[2];
      const value = req.query[key] as string;

      if (!where[field]) {
        where[field] = {};
      }

      switch (operator) {
        case "eq":
          where[field] = value;
          break;
        case "ne":
          where[field].not = value;
          break;
        case "gt":
          where[field].gt = isNaN(Number(value)) ? value : Number(value);
          break;
        case "gte":
          where[field].gte = isNaN(Number(value)) ? value : Number(value);
          break;
        case "lt":
          where[field].lt = isNaN(Number(value)) ? value : Number(value);
          break;
        case "lte":
          where[field].lte = isNaN(Number(value)) ? value : Number(value);
          break;
        case "in":
          where[field].in = value.split(",").map((v) => v.trim());
          break;
        case "notIn":
          where[field].notIn = value.split(",").map((v) => v.trim());
          break;
        case "contains":
          where[field].contains = value;
          where[field].mode = "insensitive";
          break;
        case "startsWith":
          where[field].startsWith = value;
          where[field].mode = "insensitive";
          break;
        case "endsWith":
          where[field].endsWith = value;
          where[field].mode = "insensitive";
          break;
      }
    }
  });

  return where;
};

/**
 * Parse and build complete query with automatic filter detection
 * One-liner solution for all pagination and filtering needs
 *
 * @example
 * const query = parseQuery(req, {
 *   searchFields: ["name", "email"],
 *   filterFields: ["role", "status"],
 *   booleanFields: ["isAccountVerified", "isActive"],
 *   numberFields: ["price", "quantity"],
 *   dateFields: ["createdAt", "updatedAt"]
 * });
 *
 * const [items, total] = await Promise.all([
 *   prisma.model.findMany({ ...query.prisma }),
 *   prisma.model.count({ where: query.where })
 * ]);
 */
export const parseQuery = (
  req: Request,
  config: QueryConfig = {}
): ParsedQuery & { prisma: any } => {
  const {
    searchFields = [],
    filterFields = [],
    booleanFields = [],
    numberFields = [],
    dateFields = [],
    dateRangeField = "createdAt",
    rangeFields = [],
    customFilters,
    ...paginationOptions
  } = config;

  // Get pagination
  const pagination = getPaginationParams(req, paginationOptions);

  // Build where clause automatically
  const where: any = {};
  const filters: FilterOptions = {};

  // Parse advanced filters (field[operator]=value)
  const advancedFilters = parseAdvancedFilters(req);
  Object.assign(where, advancedFilters);

  // Search functionality
  if (req.query.search && searchFields.length > 0) {
    filters.search = req.query.search as string;
    where.OR = searchFields.map((field) => ({
      [field]: {
        contains: filters.search,
        mode: "insensitive",
      },
    }));
  }

  // Auto-detect string filters
  filterFields.forEach((field) => {
    if (req.query[field] && !req.query[field].toString().includes("[")) {
      const value = req.query[field] as string;
      filters[field] = value;

      // Support comma-separated values for IN query
      if (value.includes(",")) {
        where[field] = { in: value.split(",").map((v) => v.trim()) };
      } else {
        where[field] = value;
      }
    }
  });

  // Auto-detect boolean filters
  booleanFields.forEach((field) => {
    if (req.query[field] !== undefined) {
      filters[field] = req.query[field] === "true";
      where[field] = req.query[field] === "true";
    }
  });

  // Auto-detect number filters
  numberFields?.forEach((field) => {
    if (
      req.query[field] !== undefined &&
      !req.query[field].toString().includes("[")
    ) {
      const value = Number(req.query[field]);
      if (!isNaN(value)) {
        filters[field] = value;
        where[field] = value;
      }
    }
  });

  // Auto-detect date filters
  dateFields?.forEach((field) => {
    if (req.query[field] && !req.query[field].toString().includes("[")) {
      const date = new Date(req.query[field] as string);
      if (!isNaN(date.getTime())) {
        filters[field] = date;
        where[field] = date;
      }
    }
  });

  // Date range filter
  if (req.query.dateFrom || req.query.dateTo) {
    where[dateRangeField] = {};
    if (req.query.dateFrom) {
      filters.dateFrom = new Date(req.query.dateFrom as string);
      where[dateRangeField].gte = filters.dateFrom;
    }
    if (req.query.dateTo) {
      filters.dateTo = new Date(req.query.dateTo as string);
      where[dateRangeField].lte = filters.dateTo;
    }
  }

  // Range filters (e.g., priceRange=0,500)
  const ranges: Record<string, { min: number | Date; max: number | Date }> = {};
  rangeFields.forEach((field) => {
    const rangeParam = req.query[`${field}Range`] as string;
    if (rangeParam) {
      const [minStr, maxStr] = rangeParam.split(",").map((s) => s.trim());
      if (minStr && maxStr) {
        // Try to parse as number first
        const minNum = parseFloat(minStr);
        const maxNum = parseFloat(maxStr);

        if (!isNaN(minNum) && !isNaN(maxNum)) {
          ranges[field] = { min: minNum, max: maxNum };
          where[field] = {
            gte: minNum,
            lte: maxNum,
          };
        } else {
          // Try as date
          const minDate = new Date(minStr);
          const maxDate = new Date(maxStr);
          if (!isNaN(minDate.getTime()) && !isNaN(maxDate.getTime())) {
            ranges[field] = { min: minDate, max: maxDate };
            where[field] = {
              gte: minDate,
              lte: maxDate,
            };
          }
        }
      }
    }
  });

  if (Object.keys(ranges).length > 0) {
    filters.ranges = ranges;
  }

  // Apply custom filters
  if (customFilters) {
    customFilters(req, where);
  }

  // Build order by
  const orderBy = buildOrderByClause(pagination.sortBy, pagination.sortOrder);

  // Return everything including ready-to-use Prisma object
  return {
    pagination,
    where,
    orderBy,
    filters,
    prisma: {
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    },
  };
};

/**
 * Execute paginated query with single function call
 * Complete solution: parse, query, and format response
 *
 * @example
 * const result = await executePaginatedQuery(
 *   req,
 *   prisma.user,

/**
 * Execute paginated query with single function call
 * Complete solution: parse, query, and format response
 *
 * @example
 * const result = await executePaginatedQuery(
 *   req,
 *   prisma.user,
 *   {
 *     searchFields: ["name", "email"],
 *     filterFields: ["role"],
 *     booleanFields: ["isAccountVerified"],
 *     numberFields: ["age"],
 *     customFilters: (req, where) => {
 *       if (req.user?.role !== "SUPER_ADMIN") {
 *         where.isPublic = true;
 *       }
 *     }
 *   },
 *   { id: true, name: true, email: true }
 * );
 */
export const executePaginatedQuery = async <T, TSelect = any>(
  req: Request,
  model: any,
  config: QueryConfig = {},
  select?: TSelect
): Promise<PaginatedResponse<T>> => {
  const query = parseQuery(req, config);

  const queryOptions: any = {
    where: query.where,
    orderBy: query.orderBy,
    skip: query.pagination.skip,
    take: query.pagination.limit,
  };

  if (select) {
    queryOptions.select = select;
  }

  const [data, total] = await Promise.all([
    model.findMany(queryOptions),
    model.count({ where: query.where }),
  ]);

  return createPaginatedResponse(
    data,
    total,
    query.pagination.page,
    query.pagination.limit
  );
};
