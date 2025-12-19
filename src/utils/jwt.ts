import env from "@/config/env";
import httpStatus from "@/constant/httpStatus";
import { USER_ROLE_ENUM } from "@/generated/enums";
import AppError from "@/helpers/AppError";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: USER_ROLE_ENUM;
  iat?: number;
  exp?: number;
}

export interface PasswordResetPayload {
  email: string;
  purpose: "password-reset";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate Access Token (short-lived)
 */
export const generateAccessToken = (payload: {
  userId: string;
  email: string;
}): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Generate Refresh Token (long-lived)
 */
export const generateRefreshToken = (payload: {
  userId: string;
  email: string;
}): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Generate both Access and Refresh tokens
 */
export const generateTokenPair = (payload: {
  userId: string;
  email: string;
}): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Token has been revoked. Please login again."
      );
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Access token expired.", {
        signOut: true,
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      console.log({ error, token });
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token");
    }
    throw error;
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = async (
  token: string
): Promise<JwtPayload> => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Refresh token has been revoked. Please login again.",
        {
          signOut: true,
        }
      );
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Refresh token expired. Please login again."
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
    throw error;
  }
};

/**
 * Blacklist a token (add to ExpiredTokens table)
 */
export const blacklistToken = async (
  token: string,
  userId: string,
  tokenType: "ACCESS" | "REFRESH" | "PASSWORD_RESET"
): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid token format");
    }

    // Add token to blacklist
    await prisma.expiredTokens.create({
      data: {
        userId,
        token,
        tokenType,
        expiresAt: new Date(decoded.exp * 1000),
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to blacklist token"
    );
  }
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklistedToken = await prisma.expiredTokens.findFirst({
    where: {
      token,
      isRevoked: true,
    },
  });

  return !!blacklistedToken;
};

/**
 * Clean up expired tokens from database (run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  await prisma.expiredTokens.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};

/**
 * Revoke all tokens for a user (useful for logout from all devices)
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  // This would require storing all active tokens
  // For now, we'll mark all existing tokens as revoked
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
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string => {
  return authHeader ?? "";

  // const parts = authHeader.split(" ");
  // if (parts.length !== 2 || parts[0] !== "Bearer") {
  //   return null;
  // }

  // return parts[1] || null;
};

/**
 * Generate Password Reset Token (short-lived, 15 minutes)
 */
export const generatePasswordResetToken = (
  email: string,
  id: string
): string => {
  return jwt.sign(
    {
      userId: id,
      email,
      purpose: "password-reset",
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m", // 15 minutes for password reset
    } as jwt.SignOptions
  );
};

/**
 * Verify Password Reset Token
 */
export const verifyPasswordResetToken = async (
  token: string
): Promise<PasswordResetPayload> => {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as PasswordResetPayload;

    if (decoded.purpose !== "password-reset") {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid token type. This token cannot be used for password reset."
      );
    }

    // Check if token has been revoked
    const isRevoked = await isTokenBlacklisted(token);
    if (isRevoked) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Oops! This OTP has already been used."
      );
    }

    return decoded;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === "TokenExpiredError") {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Password reset token has expired. Please request a new one."
      );
    }

    if (error.name === "JsonWebTokenError") {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid password reset token"
      );
    }

    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Failed to verify password reset token"
    );
  }
};

/**
 * Decode token without verification (for getting user info)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
