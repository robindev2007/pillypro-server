import z from "zod";

/**
 * Sign up validation schema
 */
const signUpSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),
      email: z.email("Invalid email format"),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(50, "Password must not exceed 50 characters"),

      isAgreeWithTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to the terms and conditions",
      }),
    })
    .strict(),
});

/**
 * Verify email validation schema
 */
const verifyEmailSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
    otp: z
      .string()
      .length(4, "OTP must be exactly 4 characters")
      .regex(/^\d+$/, "OTP must contain only numbers"),
  }),
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    fcmToken: z.string().optional(),
  }),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(50, "New password must not exceed 50 characters"),
  }),
});

/**
 * Resend OTP validation schema
 */
const resendOTPSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
  }),
});

/**
 * Forgot password validation schema
 */
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
  }),
});

/**
 * Verify forgot password OTP validation schema
 */
const verifyForgotPasswordOTPSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
    otp: z
      .string()
      .length(4, "OTP must be exactly 4 characters")
      .regex(/^\d+$/, "OTP must contain only numbers"),
  }),
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(50, "New password must not exceed 50 characters"),
  }),
});

const logoutSchema = z.object({
  body: z.object({
    fcmToken: z.string().optional(),
  }),
});

export const AuthValidation = {
  signUpSchema,
  verifyEmailSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  verifyForgotPasswordOTPSchema,
  resetPasswordSchema,
  logoutSchema,
};

// Export types
export type SignUpInput = z.infer<typeof signUpSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type ResendOTPInput = z.infer<typeof resendOTPSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type VerifyForgotPasswordOTPInput = z.infer<
  typeof verifyForgotPasswordOTPSchema
>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
