import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import {
  deleteCache,
  deleteCachePattern,
  flushCache,
  getCache,
  getCacheStats,
  setCache,
} from "@/lib/cache";
import { authorize } from "@/middleware/auth.middleware";
import { Router } from "express";

const router = Router();

// ============================================================
// CACHE MANAGEMENT ENDPOINTS (SUPER_ADMIN ONLY)
// ============================================================

/**
 * Get cache statistics
 * GET /api/cache/stats
 */
router.get(
  "/stats",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    const stats = getCacheStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Cache statistics retrieved successfully",
      data: stats,
    });
  })
);

/**
 * Get cache value by key
 * GET /api/cache/:key
 */
router.get(
  "/:key",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    const { key } = req.params;

    const value = await getCache(key as string);

    if (!value) {
      throw new AppError(httpStatus.NOT_FOUND, "Cache key not found");
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Cache value retrieved successfully",
      data: { key, value },
    });
  })
);

/**
 * Set cache value
 * POST /api/cache
 * Body: { key: string, value: any, ttl?: number }
 */
router.post(
  "/",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    const { key, value, ttl } = req.body;

    if (!key || value === undefined) {
      throw new AppError(httpStatus.BAD_REQUEST, "Key and value are required");
    }

    await setCache(key, value, ttl);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Cache value set successfully",
      data: { key, ttl: ttl || "default" },
    });
  })
);

/**
 * Delete cache by key
 * DELETE /api/cache/:key
 */
router.delete(
  "/:key",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    const { key } = req.params;

    await deleteCache(key as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Cache key deleted successfully",
      data: { key },
    });
  })
);

/**
 * Delete cache by pattern
 * DELETE /api/cache/pattern/:pattern
 */
router.delete(
  "/pattern/:pattern",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    const { pattern } = req.params;

    await deleteCachePattern(pattern as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Cache keys matching pattern deleted successfully`,
      data: { pattern },
    });
  })
);

/**
 * Flush all cache
 * DELETE /api/cache
 */
router.delete(
  "/",
  authorize("SUPER_ADMIN"),
  handleController(async (req, res) => {
    await flushCache();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All cache flushed successfully",
    });
  })
);

export default router;
