# Rate Limiting Guide

## Overview

Comprehensive rate limiting system to protect your API from abuse, brute force attacks, and spam.

## Available Rate Limiters

### 1. `strictRateLimit` - High Security Operations

**Use for:** Login, Signup, Email Verification

- **Limit:** 5 requests per 15 minutes per IP
- **Best for:** Preventing brute force attacks on authentication

```typescript
router.post("/login", strictRateLimit, controller);
```

### 2. `authRateLimit` - General Auth Operations

**Use for:** Token Refresh, Logout, Profile Access

- **Limit:** 10 requests per 15 minutes per IP
- **Best for:** General authenticated operations

```typescript
router.post("/logout", authRateLimit, authorize("LOGGED_IN"), controller);
```

### 3. `otpRateLimit` - OTP/Verification Codes

**Use for:** Resend OTP, Forgot Password

- **Limit:** 3 requests per 5 minutes per IP
- **Best for:** Preventing OTP spam and abuse

```typescript
router.post("/resend-otp", otpRateLimit, controller);
```

### 4. `passwordRateLimit` - Password Operations

**Use for:** Reset Password, Change Password

- **Limit:** 3 requests per 30 minutes per IP
- **Best for:** Maximum security on password changes

```typescript
router.post("/reset-password", passwordRateLimit, controller);
```

### 5. `apiRateLimit` - General API Endpoints

**Use for:** Public API endpoints, general routes

- **Limit:** 100 requests per 15 minutes per IP
- **Best for:** Preventing API abuse on public endpoints

```typescript
router.get("/posts", apiRateLimit, controller);
```

## Current Implementation

### Auth Routes Rate Limits

| Endpoint              | Rate Limiter      | Limit       | Window |
| --------------------- | ----------------- | ----------- | ------ |
| `/signup`             | strictRateLimit   | 5 requests  | 15 min |
| `/verify-email`       | strictRateLimit   | 5 requests  | 15 min |
| `/login`              | strictRateLimit   | 5 requests  | 15 min |
| `/refresh-token`      | authRateLimit     | 10 requests | 15 min |
| `/resend-otp`         | otpRateLimit      | 3 requests  | 5 min  |
| `/forgot-password`    | otpRateLimit      | 3 requests  | 5 min  |
| `/reset-password`     | passwordRateLimit | 3 requests  | 30 min |
| `/logout`             | authRateLimit     | 10 requests | 15 min |
| `/logout-all-devices` | authRateLimit     | 10 requests | 15 min |
| `/change-password`    | passwordRateLimit | 3 requests  | 30 min |
| `/profile`            | authRateLimit     | 10 requests | 15 min |

## Error Response Format

When rate limit is exceeded:

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests. Please slow down and try again later.",
  "data": {
    "retryAfter": "900",
    "hint": "You've exceeded the maximum number of requests. Please wait before trying again."
  }
}
```

### OTP Rate Limit Response

```json
{
  "success": false,
  "statusCode": 429,
  "message": "You've requested too many verification codes.",
  "data": {
    "retryAfter": "300",
    "hint": "To prevent spam, we limit OTP requests. Please wait 5 minutes before trying again.",
    "suggestion": "Check your email/spam folder for previously sent codes."
  }
}
```

### Password Rate Limit Response

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many password change attempts detected.",
  "data": {
    "retryAfter": "1800",
    "hint": "For security reasons, password changes are limited. Please wait 30 minutes.",
    "security": "If you didn't initiate these requests, please contact support immediately."
  }
}
```

## Response Headers

Rate limit information is included in standard headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 2
RateLimit-Reset: 1701789600
Retry-After: 900
```

## Development Mode

### Skip Rate Limiting (Testing)

Add header to bypass rate limits in development:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "x-skip-ratelimit: true" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Note:** Only works when `NODE_ENV=development`

## Usage Examples

### Basic Usage (Just like authorize)

```typescript
import {
  strictRateLimit,
  authRateLimit,
} from "@/middleware/rateLimit.middleware";

// Single middleware
router.post("/login", strictRateLimit, controller);

// Combined with other middleware
router.post(
  "/change-password",
  passwordRateLimit, // Rate limit first
  authorize("LOGGED_IN"), // Then auth
  validateRequest(schema), // Then validation
  controller // Finally controller
);
```

### Create Custom Rate Limiter

```typescript
import rateLimit from "express-rate-limit";

export const customRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per window
  message: "Custom rate limit message",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "Your custom message",
      data: {
        retryAfter: res.getHeader("Retry-After"),
      },
    });
  },
});
```

## Best Practices

### 1. Order Middleware Correctly

```typescript
// ✅ CORRECT ORDER
router.post(
  "/endpoint",
  rateLimit, // 1. Rate limit first (fast, protects other middleware)
  authorize(), // 2. Authentication (check if user exists)
  validation, // 3. Validation (validate input)
  controller // 4. Business logic
);

// ❌ WRONG ORDER
router.post(
  "/endpoint",
  validation, // Wastes resources validating if rate limited
  rateLimit, // Should be first
  authorize(),
  controller
);
```

### 2. Different Limits for Different Operations

- **Login/Signup:** Strict (prevent brute force)
- **OTP/Email:** Very strict (prevent spam)
- **Password:** Extremely strict (maximum security)
- **General API:** Lenient (normal usage)

### 3. Clear User Messages

```typescript
// ✅ Good message
"You've requested too many verification codes. Please wait 5 minutes.";

// ❌ Bad message
"Rate limit exceeded";
```

### 4. Include Helpful Data

```typescript
data: {
  retryAfter: "300",
  hint: "Explains why limited",
  suggestion: "Actionable next step"
}
```

## Production Considerations

### Use Redis for Distributed Systems

For multiple server instances, use Redis store:

```bash
bun add rate-limit-redis ioredis
```

```typescript
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new RedisStore({
    client: redis,
    prefix: "rl:",
  }),
  // ... other options
});
```

### Monitor Rate Limit Hits

```typescript
export const strictRateLimit = rateLimit({
  // ... config
  handler: (req, res) => {
    // Log rate limit hits
    logger.warning(`Rate limit hit: ${req.ip} on ${req.path}`);

    // Send to monitoring service (Sentry, etc.)
    // Sentry.captureMessage(`Rate limit: ${req.ip}`);

    res.status(429).json({
      // ... response
    });
  },
});
```

### IP Behind Proxy

If using reverse proxy (Nginx, CloudFlare):

```typescript
// app.ts
import express from "express";

const app = express();

// Trust proxy to get real client IP
app.set("trust proxy", 1);
```

### User-Based Rate Limiting

Limit per user instead of per IP:

```typescript
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip;
  },
});
```

## Security Benefits

✅ **Prevents brute force attacks** on login/password  
✅ **Stops OTP/email spam** abuse  
✅ **Protects database** from excessive queries  
✅ **Reduces server load** from malicious traffic  
✅ **Better user experience** with clear messages  
✅ **Complies with security best practices**

## Monitoring

Track rate limit metrics:

- Number of 429 responses per endpoint
- Most frequently rate-limited IPs
- Peak traffic times
- Abuse patterns

## Testing

```bash
# Test rate limit
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Should see 429 on 6th request
```

## Summary

Your API now has **production-ready rate limiting** with:

- ✅ 5 different rate limiters for different security levels
- ✅ User-friendly error messages
- ✅ Helpful hints and suggestions
- ✅ Development bypass for testing
- ✅ Standard HTTP headers
- ✅ Easy to use (just like authorize middleware)

All auth routes are protected with appropriate rate limits! 🛡️
