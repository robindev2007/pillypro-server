import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import handleController from "@/helpers/handleController";
import { prisma } from "@/lib/db";
import { USER_ROLE_ENUM } from "@/prisma/generated/enums";
import { extractTokenFromHeader, verifyAccessToken } from "@/utils/jwt";
import chalk from "chalk";
import type { NextFunction, Request, Response } from "express";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        email: string;
        role: USER_ROLE_ENUM;
      };
    }
  }
}

type UserRole = USER_ROLE_ENUM | "LOGGED_IN";

/**
 * Middleware to verify JWT access token and check user roles
 * @param allowedRoles - Array of roles that are allowed to access the route.
 *                       Use 'LOGGED_IN' to allow any authenticated user regardless of role.
 *                       Use specific roles like 'SUPER_ADMIN', 'USER' to restrict by role.
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return handleController(
    async (req: Request, res: Response, next: NextFunction) => {
      // Extract token from Authorization header
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Access token is required. Please login.",
          { signOut: true }
        );
      }

      // Verify token
      const decoded = await verifyAccessToken(token);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isAccountVerified: true,
        },
      });

      if (!user) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "User no longer exists. Please login again.",
          { signOut: true }
        );
      }

      // Check if user role is allowed
      // 'LOGGED_IN' is a special value that allows any authenticated user
      const isLoggedInOnly =
        allowedRoles.length === 1 && allowedRoles[0] === "LOGGED_IN";
      const hasRoleRestrictions = allowedRoles.length > 0 && !isLoggedInOnly;

      if (hasRoleRestrictions && !allowedRoles.includes(user.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource.",
          { requiredRole: allowedRoles, userRole: user.role }
        );
      }

      next();
    }
  );
};

/**
 * Middleware to verify account is verified
 */
export const requireVerifiedAccount = handleController(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAccountVerified: true },
    });

    if (!user?.isAccountVerified) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Please verify your account to access this resource"
      );
    }

    next();
  }
);

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = handleController(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const decoded = await verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (user) {
          req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
          };
        }
      } catch {
        // Silently ignore invalid tokens for optional auth
      }
    }

    next();
  }
);

/**
 * Middleware to attach user data to request if token is present
 * This is a global middleware that runs on all routes
 * - Silently attaches user data if valid token exists
 * - Does not throw errors or block requests
 * - Provides req.user on all routes for optional user context
 */
export const attachUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const decoded = await verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        console.log(chalk.green(req?.user?.role));
      }
    } catch {
      // Silently ignore any errors - don't block the request
    }
  }

  return next();
};
