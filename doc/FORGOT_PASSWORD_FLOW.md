# Forgot Password Flow - API Documentation

## Overview

The forgot password flow now uses a **3-step process** with OTP verification and JWT token-based password reset:

1. **Request OTP** - User provides email, receives OTP
2. **Verify OTP** - User verifies OTP, receives a special JWT reset token (15 min validity)
3. **Reset Password** - User uses reset token to set new password

## API Endpoints

### 1. Request Password Reset OTP

**POST** `/auth/otp/forgot-password`

Send OTP to user's email for password reset.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset OTP sent successfully. Please check your email.",
  "data": {
    "otp": "1234" // Only in development mode
  }
}
```

**Response (User Not Found - Still 200 OK for security):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset OTP sent successfully. Please check your email.",
  "data": {
    "devData": "User doesn't exist with this email" // Only in development
  }
}
```

**Notes:**

- OTP expires in **10 minutes**
- OTP is sent via email
- In production, response doesn't reveal if user exists (security)
- Rate limited to prevent abuse

---

### 2. Verify Forgot Password OTP

**POST** `/auth/otp/verify-forgot-password-otp`

Verify the OTP and receive a JWT reset token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "1234"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully. Use the reset token to change your password.",
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "OTP verified successfully. Use the reset token to change your password."
  }
}
```

**Response (Invalid/Expired OTP - 400 Bad Request):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

**Response (User Not Found - 404 Not Found):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

**Notes:**

- OTP is marked as used (revoked) after verification
- Reset token is valid for **15 minutes**
- Store the `resetToken` to use in next step

---

### 3. Reset Password with Token

**POST** `/auth/otp/reset-password`

Reset password using the JWT reset token.

**Headers:**

```
Authorization: Bearer <resetToken>
```

**Request Body:**

```json
{
  "newPassword": "NewSecurePassword123"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Response (No Token - 401 Unauthorized):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Password reset token is required"
}
```

**Response (Invalid Token - 401 Unauthorized):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid password reset token"
}
```

**Response (Expired Token - 401 Unauthorized):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Password reset token has expired. Please request a new one."
}
```

**Notes:**

- Password must be 6-50 characters
- All user sessions are logged out after password reset
- Success email is sent to user
- Reset token can only be used once

---

## Complete Flow Example

### Step 1: Request OTP

```bash
curl -X POST http://localhost:5000/auth/otp/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset OTP sent successfully. Please check your email.",
  "data": {
    "otp": "1234"
  }
}
```

### Step 2: Verify OTP & Get Reset Token

```bash
curl -X POST http://localhost:5000/auth/otp/verify-forgot-password-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "1234"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully. Use the reset token to change your password.",
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwdXJwb3NlIjoicGFzc3dvcmQtcmVzZXQiLCJpYXQiOjE3MDE3ODk2MDAsImV4cCI6MTcwMTc5MDUwMH0.signature"
  }
}
```

### Step 3: Reset Password with Token

```bash
curl -X POST http://localhost:5000/auth/otp/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "newPassword": "NewSecurePassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully. Please login with your new password."
}
```

---

## Frontend Implementation Example

### React/Next.js Example

```typescript
// Step 1: Request OTP
const requestPasswordReset = async (email: string) => {
  try {
    const response = await fetch("/auth/otp/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      alert("OTP sent to your email!");
      // Navigate to OTP verification page
      router.push(`/verify-otp?email=${email}`);
    }
  } catch (error) {
    console.error("Error requesting password reset:", error);
  }
};

// Step 2: Verify OTP
const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch("/auth/otp/verify-forgot-password-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (data.success) {
      // Store reset token (sessionStorage for security)
      sessionStorage.setItem("resetToken", data.data.resetToken);

      alert("OTP verified! Now set your new password.");
      // Navigate to password reset page
      router.push("/reset-password");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
  }
};

// Step 3: Reset Password
const resetPassword = async (newPassword: string) => {
  try {
    const resetToken = sessionStorage.getItem("resetToken");

    if (!resetToken) {
      alert("No reset token found. Please start over.");
      return;
    }

    const response = await fetch("/auth/otp/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await response.json();

    if (data.success) {
      // Clear reset token
      sessionStorage.removeItem("resetToken");

      alert("Password reset successfully! Please login.");
      // Navigate to login page
      router.push("/login");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error resetting password:", error);
  }
};
```

---

## Security Features

### 1. **OTP Security**

- 4-digit numeric code
- 10-minute expiration
- Single-use (revoked after verification)
- Rate limited requests

### 2. **Reset Token Security**

- JWT-based with signature verification
- Short validity (15 minutes)
- Special purpose flag (`password-reset`)
- Cannot be used for regular API access
- Validated on every use

### 3. **Privacy Protection**

- Doesn't reveal if email exists (production)
- All sessions logged out after password change
- Success notification sent via email

### 4. **Rate Limiting**

- `forgot-password`: OTP rate limit (3 requests per 5 minutes)
- `verify-forgot-password-otp`: OTP rate limit
- `reset-password`: Password rate limit (3 requests per 30 minutes)

---

## Error Handling

### Common Errors

**1. Invalid Email Format**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errorDetails": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**2. Invalid OTP**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired OTP. Please request a new one."
}
```

**3. Expired Reset Token**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Password reset token has expired. Please request a new one."
}
```

**4. Weak Password**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errorDetails": [
    {
      "field": "newPassword",
      "message": "New password must be at least 6 characters"
    }
  ]
}
```

---

## Testing Checklist

- [ ] Request OTP with valid email
- [ ] Request OTP with invalid email format
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code
- [ ] Verify OTP after expiration (10+ minutes)
- [ ] Reset password with valid token
- [ ] Reset password with expired token (15+ minutes)
- [ ] Reset password without token
- [ ] Reset password with weak password
- [ ] Verify email notifications sent
- [ ] Verify all sessions logged out after reset
- [ ] Test rate limiting on all endpoints

---

## Database Changes

No database migrations required - uses existing `OTP` table.

The OTP records are automatically cleaned up by the token cleanup job (runs hourly).

---

## Benefits of This Flow

✅ **More Secure** - Token-based reset instead of direct OTP to password  
✅ **Better UX** - Separate OTP verification step with clear feedback  
✅ **Time-limited** - Reset token expires in 15 minutes  
✅ **Flexible** - Frontend can implement multi-step UI easily  
✅ **Auditable** - Clear separation of verification and password change  
✅ **Standard JWT** - Uses same JWT infrastructure as auth

---

## Troubleshooting

### Issue: "Password reset token is required"

**Solution:** Make sure to include the token in Authorization header:

```
Authorization: Bearer <resetToken>
```

### Issue: "Password reset token has expired"

**Solution:** Token expires after 15 minutes. Start the flow again from Step 1.

### Issue: "Invalid or expired OTP"

**Solution:**

- OTP expires in 10 minutes
- OTP can only be used once
- Request a new OTP if expired

### Issue: Not receiving OTP email

**Solution:**

- Check spam folder
- Verify email configuration in `.env`
- Check server logs for email errors
- In development, OTP is returned in API response

---

Your new forgot password flow is ready! 🎉
