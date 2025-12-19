import { Request, Response } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

/**
 * Custom rate limit handler with user-friendly messages
 */
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: "Too many requests. Please slow down and try again later.",
    data: {
      retryAfter: res.getHeader("Retry-After"),
      hint: "You've exceeded the maximum number of requests. Please wait before trying again.",
    },
  });
};

/**
 * Create custom rate limiter - works like authorize middleware
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests per window
 * @param customMessage - Optional custom error message
 * @returns Rate limit middleware
 *
 * @example
 * // 5 requests per 10 minutes
 * router.post("/endpoint", createRateLimit(10 * 60 * 1000, 5), controller);
 *
 * // With custom message
 * router.post("/endpoint", createRateLimit(5 * 60 * 1000, 3, "Too many login attempts"), controller);
 */
export const createRateLimit = (
  windowMs: number,
  max: number,
  customMessage?: string
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: customMessage || "Too many requests. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: customMessage
      ? (req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            statusCode: 429,
            message: customMessage,
            data: {
              retryAfter: res.getHeader("Retry-After"),
              hint: "You've exceeded the maximum number of requests. Please wait before trying again.",
            },
          });
        }
      : rateLimitHandler,
  });
};

/**
 * Strict rate limiter for sensitive operations
 * Use for: Login, signup, password reset, OTP verification
 * Limits: 5 requests per 15 minutes per IP
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 10 requests per window
  message: "Too many attempts. Please try again after 15 minutes.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
});

/**
 * Moderate rate limiter for authentication operations
 * Use for: Token refresh, logout, change password
 * Limits: 10 requests per 15 minutes per IP
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 10 requests per window
  message: "Too many authentication requests. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Lenient rate limiter for OTP operations
 * Use for: Resend OTP, forgot password
 * Limits: 3 requests per 5 minutes per IP
 */
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 18, // 3 requests per window
  message:
    "Too many OTP requests. Please wait 5 minutes before requesting again.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "You've requested too many verification codes.",
      data: {
        retryAfter: res.getHeader("Retry-After"),
        hint: "To prevent spam, we limit OTP requests. Please wait 5 minutes before trying again.",
        suggestion: "Check your email/spam folder for previously sent codes.",
      },
    });
  },
});

/**
 * General API rate limiter
 * Use for: General API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many API requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Very strict rate limiter for password operations
 * Use for: Password reset, password change
 * Limits: 3 requests per 30 minutes per IP
 */
export const passwordRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 20, // 10 requests per window
  message: "Too many password change attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Too many password change attempts detected.",
      data: {
        retryAfter: res.getHeader("Retry-After"),
        hint: "For security reasons, password changes are limited. Please wait 30 minutes.",
        security:
          "If you didn't initiate these requests, please contact support immediately.",
      },
    });
  },
});
