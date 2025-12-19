/**
 * How to Use the Authentication System in Your Routes
 *
 * This guide shows you how to protect your routes and access user information
 */

import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import {
  authorize,
  optionalAuth,
  requireVerifiedAccount,
} from "@/middleware/auth.middleware";
import express from "express";

const router = express.Router();

// ============================================
// EXAMPLE 1: Public Route (No Authentication)
// ============================================
router.get(
  "/public",
  handleController(async (req, res) => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "This is a public route, anyone can access",
      data: { info: "No authentication required" },
    });
  })
);

// ============================================
// EXAMPLE 2: Protected Route (Requires Authentication)
// ============================================
router.get(
  "/protected",
  authorize("LOGGED_IN"),
  handleController(async (req, res) => {
    // req.user is available here after authenticate middleware
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "You are authenticated!",
      data: {
        userId,
        userEmail,
        info: "This route is protected by JWT authentication",
      },
    });
  })
);

// ============================================
// EXAMPLE 3: Protected + Verified Account Required
// ============================================
router.get(
  "/verified-only",
  authorize("LOGGED_IN"),
  requireVerifiedAccount,
  handleController(async (req, res) => {
    // User is authenticated AND their account is verified
    const userId = req.user?.userId;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "You have a verified account!",
      data: {
        userId,
        info: "This route requires both authentication and email verification",
      },
    });
  })
);

// ============================================
// EXAMPLE 4: Optional Authentication
// ============================================
router.get(
  "/optional-auth",
  optionalAuth,
  handleController(async (req, res) => {
    // req.user will be available if token was provided and valid
    // Otherwise req.user will be undefined

    if (req.user) {
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Authenticated user",
        data: {
          userId: req.user.userId,
          email: req.user.email,
          userType: "authenticated",
        },
      });
    } else {
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Guest user",
        data: {
          userType: "guest",
          info: "No token provided",
        },
      });
    }
  })
);

// ============================================
// EXAMPLE 5: User-Specific Data
// ============================================
router.get(
  "/my-data",
  authorize("LOGGED_IN"),
  handleController(async (req, res) => {
    const userId = req.user!.userId; // ! is safe here because authenticate ensures user exists

    // Fetch user-specific data from database
    // const userData = await prisma.user.findUnique({
    //   where: { id: userId },
    // });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User data retrieved",
      data: {
        userId,
        message: "Fetch your data using the userId from req.user",
      },
    });
  })
);

// ============================================
// EXAMPLE 6: Create Resource for Authenticated User
// ============================================
router.post(
  "/create-item",
  authorize("LOGGED_IN"),
  handleController(async (req, res) => {
    const userId = req.user!.userId;
    const { title, description } = req.body;

    // Create item in database associated with the user
    // const newItem = await prisma.item.create({
    //   data: {
    //     title,
    //     description,
    //     userId, // Associate with authenticated user
    //   },
    // });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Item created successfully",
      data: {
        userId,
        title,
        description,
      },
    });
  })
);

// ============================================
// EXAMPLE 7: Update User's Own Resource
// ============================================
router.patch(
  "/update-item/:id",
  authorize("LOGGED_IN"),
  handleController(async (req, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    const { title } = req.body;

    // Check if item belongs to user before updating
    // const item = await prisma.item.findFirst({
    //   where: {
    //     id: itemId,
    //     userId, // Ensure user owns this item
    //   },
    // });
    //
    // if (!item) {
    //   throw new AppError(404, "Item not found or you don't have permission");
    // }
    //
    // const updated = await prisma.item.update({
    //   where: { id: itemId },
    //   data: { title },
    // });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Item updated successfully",
      data: { itemId, title, userId },
    });
  })
);

// ============================================
// EXAMPLE 8: Delete User's Own Resource
// ============================================
router.delete(
  "/delete-item/:id",
  authorize("LOGGED_IN"),
  handleController(async (req, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;

    // Delete only if item belongs to user
    // await prisma.item.deleteMany({
    //   where: {
    //     id: itemId,
    //     userId, // Ensure user owns this item
    //   },
    // });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Item deleted successfully",
      data: { itemId, userId },
    });
  })
);

// ============================================
// EXAMPLE 9: Admin-Only Route (Custom Middleware)
// ============================================

// First, create an admin check middleware (add to auth.middleware.ts):
/*
export const requireAdmin = handleController(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }, // Assuming you have a role field
    });

    if (user?.role !== "ADMIN") {
      throw new AppError(httpStatus.FORBIDDEN, "Admin access required");
    }

    next();
  }
);
*/

// Then use it in routes:
/*
router.get(
  "/admin-only",
  authorize("LOGGED_IN",),
  requireAdmin,
  handleController(async (req, res) => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin access granted",
      data: { adminData: "sensitive information" },
    });
  })
);
*/

// ============================================
// TypeScript Type for req.user
// ============================================
/*
The req.user object has this structure:

interface User {
  userId: string;
  email: string;
}

Access it in your controllers:
- req.user?.userId  // Optional chaining if not sure
- req.user!.userId  // Non-null assertion after authenticate middleware
*/

// ============================================
// Error Handling
// ============================================
/*
All authentication errors are automatically handled:

1. No token provided:
   - Status: 401
   - Message: "Access token is required. Please login."

2. Invalid token:
   - Status: 401
   - Message: "Invalid access token"

3. Expired token:
   - Status: 401
   - Message: "Access token expired. Please refresh your token."

4. Revoked token:
   - Status: 401
   - Message: "Token has been revoked. Please login again."

5. User deleted:
   - Status: 401
   - Message: "User no longer exists. Please login again."

6. Unverified account (with requireVerifiedAccount):
   - Status: 403
   - Message: "Please verify your account to access this resource"
*/

// ============================================
// Best Practices
// ============================================
/*
1. Always use authenticate middleware for protected routes
2. Use req.user!.userId (non-null assertion) after authenticate
3. Validate resource ownership before allowing updates/deletes
4. Don't expose sensitive user data in responses
5. Use specific error messages for better debugging
6. Always validate input even on protected routes
7. Consider rate limiting on sensitive operations
8. Log important user actions for audit trails
9. Use transactions for complex operations
10. Test your protected routes thoroughly
*/

export default router;
