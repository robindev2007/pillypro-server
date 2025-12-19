# 🔧 Development Mode OTP Feature

## Overview

In **development mode**, OTP codes are now included in API responses for easier testing. No need to check emails or console logs!

## 📍 Endpoints with OTP in Response (Dev Mode Only)

### 1. Sign Up

```bash
POST /api/auth/signup
```

**Response in Dev Mode:**

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
    "message": "Please check your email for verification code",
    "otp": "123456" // ✅ OTP included in dev mode!
  }
}
```

### 2. Resend OTP

```bash
POST /api/auth/resend-otp
```

**Response in Dev Mode:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully. Please check your email.",
  "data": {
    "otp": "654321" // ✅ OTP included in dev mode!
  }
}
```

### 3. Forgot Password

```bash
POST /api/auth/forgot-password
```

**Response in Dev Mode:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "If an account exists with this email, a password reset code has been sent.",
  "data": {
    "otp": "789012" // ✅ OTP included in dev mode!
  }
}
```

### 4. Sign Up (Existing Unverified User)

When signing up with an email that exists but isn't verified:

**Error Response in Dev Mode:**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Account exists but not verified. A new OTP has been sent to your email. [DEV OTP: 456789]"
}
```

## 🔒 Production Mode

In **production mode** (`NODE_ENV=production`):

- ❌ OTP is **NOT** included in responses
- ✅ OTP only sent via email
- ✅ More secure, no OTP exposure

## 🎯 How It Works

The system checks `env.isDevelopment` (from your `.env` file):

```typescript
// In auth.service.ts
return {
  user: { ... },
  message: "...",
  ...(env.isDevelopment && { otp }), // Only in dev mode
};
```

## 🧪 Testing Examples

### Test Signup Flow

```bash
# 1. Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "location": "Test City",
    "isAgreeWithTerms": true
  }'

# Response includes OTP: "otp": "123456"

# 2. Use the OTP from response to verify
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Test Password Reset Flow

```bash
# 1. Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Response includes OTP: "otp": "654321"

# 2. Reset password with OTP
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "654321",
    "newPassword": "newPassword123",
    "confirmPassword": "newPassword123"
  }'
```

## 📊 Comparison

| Feature         | Development Mode       | Production Mode |
| --------------- | ---------------------- | --------------- |
| OTP in Response | ✅ Yes                 | ❌ No           |
| OTP in Email    | ✅ Yes                 | ✅ Yes          |
| OTP in Console  | ✅ Yes                 | ❌ No           |
| Security        | ⚠️ Lower (for testing) | ✅ High         |

## 🔧 Environment Configuration

Your `.env` file controls this behavior:

```env
NODE_ENV=development  # OTP in responses
# NODE_ENV=production  # OTP NOT in responses
```

## 💡 Benefits

### Development Mode

- ✅ **Faster Testing** - No need to check emails
- ✅ **No Email Setup Required** - Test without configuring Gmail
- ✅ **Easier Debugging** - OTP visible in API response
- ✅ **Automated Testing** - Can extract OTP from response
- ✅ **Team Collaboration** - Share test responses easily

### Production Mode

- ✅ **Secure** - OTP never exposed in API
- ✅ **Professional** - Proper email-only delivery
- ✅ **Compliant** - Follows security best practices

## 🚀 Quick Test

```bash
# Check your current mode
echo $NODE_ENV  # or check .env file

# Test signup and get OTP in response (dev mode)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@test.com",
    "password": "test123",
    "name": "Quick Test",
    "location": "Test",
    "isAgreeWithTerms": true
  }' | jq '.data.otp'

# Output: "123456" (your OTP)
```

## ⚠️ Security Note

**IMPORTANT:**

- Always use `NODE_ENV=production` in production!
- Never commit OTP codes to version control
- This feature is for development convenience only
- Production should always send OTP via email only

## 🎉 Summary

✅ **Development:** OTP included in API responses for easy testing
✅ **Production:** OTP sent via email only (secure)
✅ **Automatic:** No code changes needed, controlled by NODE_ENV
✅ **Convenient:** Test auth flows without email setup

---

**Now you can test authentication flows faster without checking emails!** 🚀
