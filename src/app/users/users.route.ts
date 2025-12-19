// app/users/users.route.ts
import validateRequest from "@/helpers/validateRequest";
import { authorize } from "@/middleware/auth.middleware";
import { apiRateLimit } from "@/middleware/rateLimit.middleware";
import { FileTypes, uploadSingle } from "@/middleware/upload.middleware";
import express from "express";
import { UsersController } from "./users.controller";
import { UsersValidation } from "./users.validation";

const router = express.Router();

// ============================================================
// SUPER_ADMIN ONLY ROUTES
// ============================================================

/**
 * Get all users (with pagination)
 * GET /users
 */
router.get(
  "/",
  apiRateLimit,
  authorize("SUPER_ADMIN"),
  UsersController.getAllUsers
);

// ============================================================
// AUTHENTICATED USER ROUTES
// ============================================================

/**
 * Get current user profile
 * GET /users/me
 */
router.get("/me", apiRateLimit, authorize("LOGGED_IN"), UsersController.getMe);

/**
 * Get user by ID
 * GET /users/:id
 */
router.get(
  "/:id",
  apiRateLimit,
  authorize("SUPER_ADMIN"),
  validateRequest(UsersValidation.getUserByIdSchema),
  UsersController.getUserById
);

/**
 * Update current user profile
 * PUT /users/me
 */
router.put(
  "/me",
  apiRateLimit,
  authorize("LOGGED_IN"),
  uploadSingle("profile", {
    allowedTypes: FileTypes.IMAGES,
    maxSize: 5 * 1024 * 1024, // 5MB
  }),
  validateRequest(UsersValidation.updateProfileSchema),
  UsersController.updateProfile
);

/**
 * Delete current user account
 * DELETE /users/me
 */
router.delete(
  "/me",
  apiRateLimit,
  authorize("LOGGED_IN"),
  UsersController.deleteUserAccount
);

export const UsersRoutes = router;
