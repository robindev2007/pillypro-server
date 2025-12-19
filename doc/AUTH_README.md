# JWT Authentication System - API Documentation

## 🔐 Industry-Standard Security Features

This authentication system implements enterprise-level security practices:

- ✅ **JWT Access & Refresh Tokens** - Secure token-based authentication
- ✅ **Token Blacklisting** - Revoked tokens are stored and checked
- ✅ **Token Rotation** - New tokens issued on refresh, old ones blacklisted
- ✅ **Automatic Cleanup** - Expired tokens removed hourly
- ✅ **Email Verification** - OTP-based account verification
- ✅ **Password Reset** - Secure OTP-based password recovery
- ✅ **Multi-Device Logout** - Revoke all sessions across devices
- ✅ **Secure Password Hashing** - bcrypt with configurable salt rounds
- ✅ **Request Validation** - Zod schema validation on all endpoints

---

## 📋 API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Sign Up

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "location": "New York",
  "isAgreeWithTerms": true
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "isAccountVerified": false
    },
    "message": "Please check your email for verification code"
  }
}
```

---

#### 2. Verify Email

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "isAccountVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

#### 3. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "profile": "",
      "location": "New York",
      "isAccountVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

#### 4. Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** The old refresh token is automatically blacklisted.

---

#### 5. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully. Please check your email."
}
```

---

#### 6. Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "If an account exists with this email, a password reset code has been sent."
}
```

---

#### 7. Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Note:** All user tokens are revoked after password reset.

---

### Protected Endpoints (Authentication Required)

**All protected endpoints require:**

```http
Authorization: Bearer <accessToken>
```

---

#### 8. Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": "clx...",
    "email": "user@example.com"
  }
}
```

---

#### 9. Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

**Note:** The current access token is blacklisted.

---

#### 10. Logout All Devices

```http
POST /api/auth/logout-all-devices
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out from all devices successfully"
}
```

**Note:** All user tokens across all devices are revoked.

---

#### 11. Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully. Please login again with your new password."
}
```

**Note:** All user tokens are revoked after password change.

---

## 🔧 Environment Variables

Required in your `.env` file:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=20m
JWT_REFRESH_EXPIRES_IN=15d

# Password Hashing
BCRYPT_SALT_ROUNDS=12
```

---

## 🛡️ Security Best Practices Implemented

### 1. **Token Expiration**

- **Access Token:** Short-lived (20 minutes default)
- **Refresh Token:** Long-lived (15 days default)
- Prevents long-term token compromise

### 2. **Token Blacklisting**

- All revoked tokens are stored in database
- Tokens are checked against blacklist on every request
- Automatic cleanup of expired blacklisted tokens (hourly)

### 3. **Token Rotation**

- New refresh token issued on every refresh
- Old refresh token is immediately blacklisted
- Prevents token replay attacks

### 4. **Password Security**

- Bcrypt hashing with 12 rounds (configurable)
- Passwords never stored in plain text
- Strong password validation (min 6 chars)

### 5. **Account Verification**

- Email verification required before login
- OTP expires in 10 minutes
- Prevents fake account creation

### 6. **Multi-Device Security**

- Track active sessions
- Ability to logout from all devices
- Force re-authentication on password change

### 7. **Rate Limiting Ready**

- Structure supports rate limiting middleware
- Prevents brute force attacks

---

## 🔄 Token Flow

### Normal Authentication Flow

```
1. Sign Up → OTP sent to email
2. Verify Email with OTP → Get access & refresh tokens
3. Use access token for API requests
4. When access token expires → Use refresh token
5. Get new access & refresh tokens
6. Old refresh token is blacklisted
```

### Logout Flow

```
1. Client calls /logout with access token
2. Access token is blacklisted
3. Client discards tokens
4. Subsequent requests with blacklisted token fail
```

---

## 🧪 Testing the API

### Example: Complete Authentication Flow

**1. Sign Up:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "location": "Test City",
    "isAgreeWithTerms": true
  }'
```

**2. Verify Email (use OTP from console/email):**

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**3. Use Access Token:**

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**4. Refresh Token (when access token expires):**

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 📦 Database Schema

### ExpiredTokens Table

```prisma
model ExpiredTokens {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String
  expiresAt DateTime
  isRevoked Boolean       @default(false)
  tokenType TokenTypeEnum
  revokedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

enum TokenTypeEnum {
  ACCESS
  REFRESH
}
```

### OTP Table

```prisma
model OTP {
  id        String   @id @default(cuid())
  email     String
  code      String
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🚀 Usage in Your Code

### Protecting Routes

```typescript
import {
  authenticate,
  requireVerifiedAccount,
} from "@/middleware/auth.middleware";

// Require authentication
router.get("/protected", authenticate, yourController);

// Require authentication + verified account
router.get(
  "/verified-only",
  authenticate,
  requireVerifiedAccount,
  yourController
);

// Optional authentication (user info attached if token provided)
router.get("/optional", optionalAuth, yourController);
```

### Accessing User in Controller

```typescript
const yourController = handleController(async (req, res) => {
  const userId = req.user?.userId; // Available after authenticate middleware
  const email = req.user?.email;

  // Your logic here
});
```

---

## 🔄 Automatic Cleanup

The system automatically cleans up expired tokens every hour:

- Removes expired blacklisted tokens
- Removes expired OTPs
- Logs cleanup activity

To manually trigger cleanup:

```typescript
import { cleanupExpiredTokens, cleanupExpiredOTPs } from "@/utils/tokenCleanup";

await cleanupExpiredTokens();
await cleanupExpiredOTPs();
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token expired. Please refresh your token.",
  "errorMessages": [
    {
      "path": "",
      "message": "Access token expired. Please refresh your token."
    }
  ]
}
```

Common status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (unverified account)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

---

## 📝 TODO for Production

1. **Email Integration:**

   - Implement actual email sending (Nodemailer, SendGrid, etc.)
   - Replace TODO comments in auth.service.ts

2. **Rate Limiting:**

   - Add express-rate-limit middleware
   - Protect login, signup, and OTP endpoints

3. **HTTPS:**

   - Enable HTTPS in production
   - Use secure cookies for tokens

4. **Monitoring:**

   - Add logging for failed login attempts
   - Track token usage patterns
   - Monitor blacklist table size

5. **Additional Security:**
   - Implement CSRF protection
   - Add IP-based rate limiting
   - Consider adding 2FA

---

## 🎯 Key Files

- `src/utils/jwt.ts` - JWT utilities & token management
- `src/middleware/auth.middleware.ts` - Authentication middleware
- `src/app/auth/auth.service.ts` - Business logic
- `src/app/auth/auth.controller.ts` - Request handlers
- `src/app/auth/auth.route.ts` - Route definitions
- `src/app/auth/auth.validation.ts` - Zod schemas
- `src/utils/tokenCleanup.ts` - Automated cleanup jobs

---

**Built with ❤️ for production-grade security**
