/**
 * JWT Authentication System - Quick Test Examples
 *
 * Use these examples to test your auth endpoints with curl or any API client
 */

// ========================================
// 1. SIGN UP
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "name": "John Doe",
    "location": "New York, USA",
    "isAgreeWithTerms": true
  }'

Expected Response:
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "isAccountVerified": false
    },
    "message": "Please check your email for verification code"
  }
}

NOTE: Check console for OTP code (since email is not configured yet)
*/

// ========================================
// 2. VERIFY EMAIL
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "otp": "123456"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "isAccountVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}

SAVE THESE TOKENS! You'll need them for authenticated requests.
*/

// ========================================
// 3. LOGIN (if already verified)
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "profile": "",
      "location": "New York, USA",
      "isAccountVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
*/

// ========================================
// 4. GET PROFILE (Protected Route)
// ========================================
/*
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": "...",
    "email": "john.doe@example.com"
  }
}
*/

// ========================================
// 5. REFRESH TOKEN (when access token expires)
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

NOTE: Old refresh token is automatically blacklisted!
*/

// ========================================
// 6. CHANGE PASSWORD (Protected)
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "securePassword123",
    "newPassword": "newSecurePassword456",
    "confirmPassword": "newSecurePassword456"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully. Please login again with your new password."
}

NOTE: All tokens are revoked after password change!
*/

// ========================================
// 7. LOGOUT (Protected)
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}

NOTE: Your access token is now blacklisted and won't work anymore!
*/

// ========================================
// 8. LOGOUT ALL DEVICES (Protected)
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/logout-all-devices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out from all devices successfully"
}

NOTE: All tokens for your account are now blacklisted!
*/

// ========================================
// 9. FORGOT PASSWORD
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "If an account exists with this email, a password reset code has been sent."
}

NOTE: Check console for OTP code
*/

// ========================================
// 10. RESET PASSWORD
// ========================================
/*
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "otp": "123456",
    "newPassword": "brandNewPassword789",
    "confirmPassword": "brandNewPassword789"
  }'

Expected Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully. Please login with your new password."
}

NOTE: All tokens are revoked after password reset!
*/

// ========================================
// ERROR HANDLING EXAMPLES
// ========================================

// Invalid email format:
/*
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errorMessages": [
    {
      "path": "body.email",
      "message": "Invalid email format"
    }
  ]
}
*/

// Unauthorized (no token):
/*
{
  "success": false,
  "statusCode": 401,
  "message": "Access token is required. Please login."
}
*/

// Token expired:
/*
{
  "success": false,
  "statusCode": 401,
  "message": "Access token expired. Please refresh your token."
}
*/

// Token revoked:
/*
{
  "success": false,
  "statusCode": 401,
  "message": "Token has been revoked. Please login again."
}
*/

// ========================================
// SECURITY FEATURES IMPLEMENTED
// ========================================
/*
✅ JWT Access Tokens (short-lived, 20 minutes)
✅ JWT Refresh Tokens (long-lived, 15 days)
✅ Token Blacklisting (revoked tokens stored in DB)
✅ Token Rotation (new tokens on refresh, old ones blacklisted)
✅ Automatic Token Cleanup (hourly job removes expired tokens)
✅ Email Verification with OTP (10 minutes expiry)
✅ Password Reset with OTP
✅ Password Hashing with bcrypt (12 rounds)
✅ Multi-Device Logout Support
✅ Force Re-authentication on Password Change
✅ Request Validation with Zod
✅ Secure Password Requirements
✅ Protection Against Token Replay Attacks
✅ Clean Error Messages
✅ Type-Safe Implementation
*/

// ========================================
// NEXT STEPS FOR PRODUCTION
// ========================================
/*
1. Configure Email Service:
   - Install nodemailer or use SendGrid/AWS SES
   - Implement sendOTPEmail() function
   - Update auth.service.ts TODO comments

2. Add Rate Limiting:
   - Install express-rate-limit
   - Protect login, signup, OTP endpoints
   - Prevent brute force attacks

3. Enable HTTPS:
   - Get SSL certificate
   - Configure secure cookies
   - Enable HSTS headers

4. Add Logging:
   - Log failed login attempts
   - Monitor token blacklist growth
   - Track suspicious activity

5. Additional Security:
   - Implement CSRF protection
   - Add IP-based rate limiting
   - Consider 2FA/MFA
   - Add account lockout after failed attempts
   - Implement device fingerprinting
*/

export {};
