import { sendEmail } from "./email.config";
import {
  accountVerifiedTemplate,
  loginAlertTemplate,
  passwordChangedTemplate,
  passwordResetOTPTemplate,
  passwordResetSuccessTemplate,
  verificationOTPTemplate,
  welcomeEmailTemplate,
} from "./email.templates";

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (
  to: string,
  name: string
): Promise<void> => {
  const html = welcomeEmailTemplate(name);
  await sendEmail(to, "Welcome to Our Platform! 🎉", html);
};

/**
 * Send email verification OTP
 */
export const sendVerificationOTP = async (
  to: string,
  name: string,
  otp: string
): Promise<void> => {
  const html = verificationOTPTemplate(name, otp);
  await sendEmail(to, "Verify Your Email - OTP Code", html);
};

/**
 * Send password reset OTP
 */
export const sendPasswordResetOTP = async (
  to: string,
  name: string,
  otp: string
): Promise<void> => {
  const html = passwordResetOTPTemplate(name, otp);
  await sendEmail(to, "Reset Your Password - OTP Code", html);
};

/**
 * Send password changed confirmation
 */
export const sendPasswordChangedEmail = async (
  to: string,
  name: string
): Promise<void> => {
  const html = passwordChangedTemplate(name);
  await sendEmail(to, "Password Changed Successfully", html);
};

/**
 * Send account verified confirmation
 */
export const sendAccountVerifiedEmail = async (
  to: string,
  name: string
): Promise<void> => {
  const html = accountVerifiedTemplate(name);
  await sendEmail(to, "Account Verified Successfully! 🎉", html);
};

/**
 * Send login alert from new device
 */
export const sendLoginAlert = async (
  to: string,
  name: string,
  device: string,
  location: string
): Promise<void> => {
  const time = new Date().toLocaleString();
  const html = loginAlertTemplate(name, device, location, time);
  await sendEmail(to, "New Login Detected - Security Alert 🔐", html);
};

/**
 * Send password reset success confirmation
 */
export const sendPasswordResetSuccess = async (
  to: string,
  name: string
): Promise<void> => {
  const html = passwordResetSuccessTemplate(name);
  await sendEmail(to, "Password Reset Successfully", html);
};

export default {
  sendWelcomeEmail,
  sendVerificationOTP,
  sendPasswordResetOTP,
  sendPasswordChangedEmail,
  sendAccountVerifiedEmail,
  sendLoginAlert,
  sendPasswordResetSuccess,
};
