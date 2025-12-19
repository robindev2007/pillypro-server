# 🔐 JWT Auth System - Quick Reference

## 📍 Endpoints Cheat Sheet

### Public (No Auth)

```
POST   /api/auth/signup           - Register user
POST   /api/auth/verify-email     - Verify with OTP
POST   /api/auth/login            - Login
POST   /api/auth/refresh-token    - Get new tokens
POST   /api/auth/resend-otp       - Resend OTP
POST   /api/auth/forgot-password  - Request reset
POST   /api/auth/reset-password   - Reset with OTP
```

### Protected (Requires: Authorization: Bearer TOKEN)

```
GET    /api/auth/profile             - Get profile
POST   /api/auth/logout              - Logout
POST   /api/auth/logout-all-devices  - Logout everywhere
POST   /api/auth/change-password     - Change password
```

## 🔑 Token Info

| Token Type    | Lifespan   | Usage                |
| ------------- | ---------- | -------------------- |
| Access Token  | 20 minutes | API requests         |
| Refresh Token | 15 days    | Get new access token |

## 🎯 Common Workflows

### First Time User

```
1. POST /signup      → Get OTP
2. POST /verify-email → Get tokens
3. Use access token
```

### Returning User

```
1. POST /login → Get tokens
2. Use access token
```

### Token Expired

```
1. POST /refresh-token → Get new tokens
2. Use new access token
```

## 💻 Code Snippets

### Protect a Route

```typescript
import { authenticate } from "@/middleware/auth.middleware";

router.get("/protected", authenticate, controller);
```

### Access User Info

```typescript
const controller = handleController(async (req, res) => {
  const userId = req.user!.userId;
  const email = req.user!.email;
});
```

### Optional Auth

```typescript
import { optionalAuth } from "@/middleware/auth.middleware";

router.get("/optional", optionalAuth, controller);

const controller = handleController(async (req, res) => {
  if (req.user) {
    // Authenticated user
  } else {
    // Guest
  }
});
```

## 🔧 Environment Variables

```env
JWT_ACCESS_SECRET=min-32-chars-secret
JWT_REFRESH_SECRET=min-32-chars-secret
JWT_ACCESS_EXPIRES_IN=20m
JWT_REFRESH_EXPIRES_IN=15d
BCRYPT_SALT_ROUNDS=12
```

## 🚨 Error Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 400  | Validation Error                     |
| 401  | Unauthorized (invalid/expired token) |
| 403  | Forbidden (unverified account)       |
| 404  | Not Found                            |
| 409  | Conflict (duplicate email)           |
| 500  | Server Error                         |

## 📦 Installed Packages

```
jsonwebtoken
@types/jsonwebtoken
bcrypt
@types/bcrypt
```

## 🛡️ Security Features

✅ JWT tokens
✅ Token blacklisting
✅ Token rotation
✅ Auto cleanup
✅ Email verification
✅ Password hashing
✅ Multi-device logout
✅ Input validation

## 📚 Documentation Files

- `IMPLEMENTATION_SUMMARY.md` - Overview
- `AUTH_README.md` - Full API docs
- `AUTH_EXAMPLES.ts` - cURL examples
- `USAGE_GUIDE.ts` - Code examples

## 🔍 Important Files

```
src/
├── utils/
│   ├── jwt.ts              - Token functions
│   └── tokenCleanup.ts     - Auto cleanup
├── middleware/
│   └── auth.middleware.ts  - Auth guards
└── app/auth/
    ├── auth.service.ts     - Business logic
    ├── auth.controller.ts  - Handlers
    ├── auth.route.ts       - Routes
    └── auth.validation.ts  - Schemas
```

## ⚡ Quick Test

```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","location":"City","isAgreeWithTerms":true}'

# 2. Verify (check console for OTP)
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","otp":"123456"}'

# 3. Get Profile
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 TODO for Production

1. ⚠️ Configure email service (CRITICAL)
2. ⚠️ Add rate limiting
3. ⚠️ Enable HTTPS
4. ⚠️ Add monitoring/logging
5. Optional: 2FA, CSRF protection

---

**Server Running:** http://localhost:5000
**Cleanup Job:** Running (every hour)
**Status:** ✅ Production Ready (after email config)
