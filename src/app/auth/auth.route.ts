import validateRequest from "@/helpers/validateRequest";
import { authorize } from "@/middleware/auth.middleware";
import {
  authRateLimit,
  otpRateLimit,
  passwordRateLimit,
  strictRateLimit,
} from "@/middleware/rateLimit.middleware";
import express from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// Public routes - no authentication required
router.post(
  "/signup",
  strictRateLimit,
  validateRequest(AuthValidation.signUpSchema),
  AuthController.signUp
);

router.post(
  "/verify-email",
  strictRateLimit,
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthController.verifyEmail
);

router.post(
  "/login",
  strictRateLimit,
  validateRequest(AuthValidation.loginSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  authRateLimit,
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthController.refreshToken
);

router.post(
  "/resend-otp",
  otpRateLimit,
  validateRequest(AuthValidation.resendOTPSchema),
  AuthController.resendOTP
);

router.post(
  "/forgot-password",
  otpRateLimit,
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/verify-forgot-password-otp",
  otpRateLimit,
  validateRequest(AuthValidation.verifyForgotPasswordOTPSchema),
  AuthController.verifyForgotPasswordOTP
);

router.post(
  "/reset-password",
  passwordRateLimit,
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword
);

// Protected routes - require authentication
router.post(
  "/logout",
  authRateLimit,
  authorize("LOGGED_IN"),
  validateRequest(AuthValidation.logoutSchema),
  AuthController.logout
);

router.post(
  "/logout-all-devices",
  authRateLimit,
  authorize("LOGGED_IN"),
  AuthController.logoutAllDevices
);

router.post(
  "/change-password",
  passwordRateLimit,
  authorize("LOGGED_IN"),
  validateRequest(AuthValidation.changePasswordSchema),
  AuthController.changePassword
);

router.get(
  "/profile",
  authRateLimit,
  authorize("LOGGED_IN"),
  AuthController.getProfile
);

export const AuthRoutes = router;
