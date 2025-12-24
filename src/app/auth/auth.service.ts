import env from "@/config/env";
import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { insecurePrisma, prisma } from "@/lib/db";
import {
  sendAccountVerifiedEmail,
  sendPasswordChangedEmail,
  sendPasswordResetOTP,
  sendPasswordResetSuccess,
  sendVerificationOTP,
} from "@/services/email";
import {
  blacklistToken,
  generatePasswordResetToken,
  generateTokenPair,
  verifyPasswordResetToken,
  verifyRefreshToken,
  type TokenPair,
} from "@/utils/jwt";
import { generateOTP } from "@/utils/opt";
import * as bcrypt from "bcrypt";
import type {
  ChangePasswordInput,
  LoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
  SignUpInput,
  VerifyEmailInput,
  VerifyForgotPasswordOTPInput,
} from "./auth.validation";

/**
 * Sign up a new user
 */
const signUp = async (payload: SignUpInput) => {
  const emailExist = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (emailExist) {
    if (emailExist.isAccountVerified) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Account with this email already exists"
      );
    }

    // If account exists but not verified, update user info and resend OTP
    if (!emailExist.isAccountVerified) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with new information
      const hashedPassword = await bcrypt.hash(
        payload.password,
        env.BCRYPT_SALT_ROUNDS
      );

      const [updatedUser] = await Promise.all([
        prisma.user.update({
          where: { id: emailExist.id },
          data: {
            name: payload.name,
            isAgreeWithTerms: payload.isAgreeWithTerms,
            passwordHashed: hashedPassword,
          },
        }),
        prisma.oTP.create({
          data: {
            email: payload.email,
            code: otp,
            expiresAt: otpExpiry,
          },
        }),
      ]);

      // Send OTP email
      sendVerificationOTP(payload.email, updatedUser.name, otp);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAccountVerified: updatedUser.isAccountVerified,
        role: updatedUser.role,
        message: "Please check your email for verification code",
        ...(env.isDevelopment && { otp }), // Include OTP in dev mode
      };
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    env.BCRYPT_SALT_ROUNDS
  );

  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      name: payload.name,
      isAgreeWithTerms: payload.isAgreeWithTerms,
      passwordHashed: hashedPassword,
    },
  });

  // Generate OTP for email verification
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oTP.create({
    data: {
      email: newUser.email,
      code: otp,
      expiresAt: otpExpiry,
    },
  });

  // Send verification OTP email
  sendVerificationOTP(newUser.email, newUser.name, otp);

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    isAccountVerified: newUser.isAccountVerified,
    role: newUser.role,
    phone: newUser.phone,
    dateOfBirth: newUser.dateOfBirth,
    companyName: newUser.companyName,
    message: "Please check your email for verification code",
    ...(env.isDevelopment && { otp }), // Include OTP in dev mode
  };
};

/**
 * Verify email with OTP
 */
const verifyEmail = async (payload: VerifyEmailInput) => {
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      email: payload.email,
      code: payload.otp,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired OTP. Please request a new one."
    );
  }

  // Update user as verified
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isAccountVerified: true },
  });

  // Revoke the used OTP
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { isRevoked: true },
  });

  // Send account verified email
  await sendAccountVerifiedEmail(user.email, user.name);

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAccountVerified: true,
    },
    tokens,
  };
};

/**
 * Login user
 */
const login = async (
  payload: LoginInput
): Promise<{
  user: any;
  tokens: TokenPair;
}> => {
  const user = await insecurePrisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      location: true,
      isAccountVerified: true,
      passwordHashed: true,
      role: true,
      isDeleted: true,
      fcmTokens: true,
      timeZone: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User account has been deleted. Please contact support."
    );
  }

  // Check if account is verified
  if (!user.isAccountVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.passwordHashed
  );

  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  if (payload.timeZone && payload.timeZone !== user.timeZone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { timeZone: payload.timeZone },
    });
  }

  if (user.fcmTokens) {
    const existingTokens = user.fcmTokens;
    if (payload.fcmToken && !existingTokens.includes(payload.fcmToken)) {
      existingTokens.push(payload.fcmToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmTokens: existingTokens },
      });
    }
  }

  await prisma.medicineSlot.updateMany({
    where: { userId: user.id, isActive: true },
    data: { timezone: payload.timeZone || user.timeZone },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
      location: user.location,
      role: user.role,
      isAccountVerified: user.isAccountVerified,
      fcmToken: user.fcmTokens,
    },
    tokens,
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (payload: RefreshTokenInput): Promise<TokenPair> => {
  // Verify refresh token
  const decoded = await verifyRefreshToken(payload.refreshToken);

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User not found. Please login again.",
      {
        signOut: true,
      }
    );
  }

  if (!user.isAccountVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Account is not verified");
  }

  // Generate new token pair
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Optionally blacklist the old refresh token
  await blacklistToken(payload.refreshToken, user.id, "REFRESH");

  return tokens;
};

/**
 * Logout user - blacklist tokens
 */
const logout = async (
  fcmToken: string,
  accessToken: string,
  userId: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fcmTokens: true,
    },
  });

  const newFcmTokens = user?.fcmTokens.filter((token) => token !== fcmToken);
  await prisma.user.update({
    where: { id: userId },
    data: {
      fcmTokens: {
        set: newFcmTokens,
      },
    },
  });

  await blacklistToken(accessToken, userId, "ACCESS");
};

/**
 * Logout from all devices - revoke all user tokens
 */
const logoutAllDevices = async (userId: string): Promise<void> => {
  await prisma.expiredTokens.updateMany({
    where: {
      userId,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });
};

/**
 * Change password
 */
const changePassword = async (
  userId: string,
  payload: ChangePasswordInput
): Promise<void> => {
  const user = await insecurePrisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHashed: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(
    payload.currentPassword,
    user.passwordHashed
  );

  if (!isPasswordValid) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    env.BCRYPT_SALT_ROUNDS
  );

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHashed: hashedPassword },
  });

  // Send password changed email
  await sendPasswordChangedEmail(user.email, user.email);

  // Revoke all tokens to force re-login
  await logoutAllDevices(userId);
};

/**
 * Resend OTP
 */
const resendOTP = async (email: string): Promise<{ otp?: string } | void> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isAccountVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is already verified");
  }

  // Revoke old OTPs
  await prisma.oTP.updateMany({
    where: {
      email,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oTP.create({
    data: {
      email,
      code: otp,
      expiresAt: otpExpiry,
    },
  });

  // Send verification OTP email
  await sendVerificationOTP(email, user.name, otp);

  // Return OTP in dev mode
  if (env.isDevelopment) {
    return { otp };
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists or not for security
    if (env.isDevelopment) {
      return { devData: "User doesn't exist with this email" };
    }
    return;
  }

  // Generate OTP for password reset
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oTP.create({
    data: {
      email,
      code: otp,
      expiresAt: otpExpiry,
    },
  });

  // Send password reset OTP email
  sendPasswordResetOTP(email, user.name, otp);

  // Return OTP in dev mode
  if (env.isDevelopment) {
    return { otp };
  }
  return;
};

/**
 * Verify forgot password OTP and return reset token
 */
const verifyForgotPasswordOTP = async (
  payload: VerifyForgotPasswordOTPInput
) => {
  const { email, otp } = payload;

  // Find and verify OTP
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      email,
      code: otp,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired OTP. Please request a new one."
    );
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Revoke the used OTP
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { isRevoked: true },
  });

  // Generate password reset token (15 minutes validity)
  const resetToken = generatePasswordResetToken(email, user.id);

  return {
    resetToken,
    message:
      "OTP verified successfully. Use the reset token to change your password.",
  };
};

/**
 * Reset password with reset token
 */
const resetPassword = async (
  resetToken: string,
  payload: ResetPasswordInput
): Promise<void> => {
  // Verify reset token (checks expiry, purpose, and if revoked)
  const decoded = await verifyPasswordResetToken(resetToken);

  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    env.BCRYPT_SALT_ROUNDS
  );

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHashed: hashedPassword },
  });

  // Revoke the reset token to prevent reuse
  await blacklistToken(resetToken, user.id, "PASSWORD_RESET");

  // Send password reset success email
  sendPasswordResetSuccess(user.email, user.name);

  // Revoke all user sessions
  await logoutAllDevices(user.id);
};

export const AuthService = {
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
};
