// otpGenerator.ts
import crypto from "crypto";

export interface OTPOptions {
  length?: number; // Default: 6
  digitsOnly?: boolean; // Default: true (only numbers)
  expiresIn?: number; // Expiration in seconds (optional, for reference)
}

/**
 * Generates a secure OTP
 * @param options Configuration for OTP
 * @returns OTP string
 */
export const generateOTP = (options: OTPOptions = {}): string => {
  const { length = 4, digitsOnly = true } = options;

  // Define character set
  const charset = digitsOnly
    ? "0123456789"
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const otp = Array.from({ length }, () => {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  }).join("");

  return otp;
};
