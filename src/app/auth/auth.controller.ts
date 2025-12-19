import httpStatus from "@/constant/httpStatus";
import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import { extractTokenFromHeader } from "@/utils/jwt";
import { AuthService } from "./auth.service";

/**
 * Sign up a new user
 */
const signUp = handleController(async (req, res) => {
  const result = await AuthService.signUp(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully. Please verify your email.",
    data: result,
  });
});

/**
 * Verify email with OTP
 */
const verifyEmail = handleController(async (req, res) => {
  const result = await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: result,
  });
});

/**
 * Login user
 */
const login = handleController(async (req, res) => {
  const result = await AuthService.login(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
    data: result,
  });
});

/**
 * Refresh access token
 */
const refreshToken = handleController(async (req, res) => {
  const tokens = await AuthService.refreshToken(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: tokens,
  });
});

/**
 * Logout user
 */
const logout = handleController(async (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization as string);

  await AuthService.logout(req.body.fcmToken, token, req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * Logout from all devices
 */
const logoutAllDevices = handleController(async (req, res) => {
  await AuthService.logoutAllDevices(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out from all devices successfully",
  });
});

/**
 * Change password
 */
const changePassword = handleController(async (req, res) => {
  await AuthService.changePassword(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully.",
  });
});

/**
 * Resend OTP
 */
const resendOTP = handleController(async (req, res) => {
  const result = await AuthService.resendOTP(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent successfully. Please check your email.",
    ...(result && { data: result }),
  });
});

/**
 * Request password reset (sends OTP)
 */
const forgotPassword = handleController(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset OTP sent successfully. Please check your email.",
    data: result,
  });
});

/**
 * Verify forgot password OTP and get reset token
 */
const verifyForgotPasswordOTP = handleController(async (req, res) => {
  const result = await AuthService.verifyForgotPasswordOTP(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully.",
    data: result,
  });
});

/**
 * Reset password with reset token
 */
const resetPassword = handleController(async (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization as string);

  if (!token) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Password reset token is required",
    });
  }

  await AuthService.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Password reset successfully. Please login with your new password.",
  });
});

/**
 * Get current user profile
 */
const getProfile = handleController(async (req, res) => {
  if (!req.user) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Authentication required",
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: req.user,
  });
});

export const AuthController = {
  signUp,
  verifyEmail,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  changePassword,
  resendOTP,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  getProfile,
};
