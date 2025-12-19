# Authorization Middleware Guide

## Overview

The authorization system now supports role-based access control (RBAC) with flexible middleware that can check user authentication and roles.

## Available Middleware

### 1. `authorize(...allowedRoles)`

Main middleware that checks authentication and optionally validates user roles.

**Syntax:**

```typescript
authorize(...allowedRoles: string[])
```

**Usage Examples:**

```typescript
// Any authenticated user
router.get("/profile", authorize(), controller);

// Only SUPER_ADMIN
router.delete("/users/:id", authorize("SUPER_ADMIN"), controller);

// Multiple roles allowed
router.get("/admin-panel", authorize("SUPER_ADMIN", "ADMIN"), controller);

// USER role only
router.post("/posts", authorize("USER"), controller);
```

### 2. `authenticate`

Alias for `authorize()` - allows any authenticated user without role restrictions.

**Usage:**

```typescript
router.get("/profile", authenticate, controller);
// Same as: authorize()
```

### 3. `requireVerifiedAccount`

Ensures the authenticated user has verified their email account.

**Usage:**

```typescript
router.post("/create-post", authenticate, requireVerifiedAccount, controller);
```

### 4. `optionalAuth`

Authentication is optional - doesn't throw error if no token provided. Useful for routes that work differently for logged-in vs anonymous users.

**Usage:**

```typescript
router.get("/feed", optionalAuth, controller);
// req.user will be undefined if not authenticated
```

## User Roles

Available roles from Prisma schema:

- `USER` - Default role for regular users
- `SUPER_ADMIN` - Administrator with full access

## Request Object

After successful authentication, `req.user` contains:

```typescript
req.user = {
  userId: string;   // User's unique ID
  email: string;    // User's email
  role: string;     // User's role (USER, SUPER_ADMIN, etc.)
}
```

## Error Responses

### Unauthorized (401)

When no token is provided or token is invalid:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token is required. Please login.",
  "data": {
    "signOut": true
  }
}
```

### Forbidden (403)

When user doesn't have the required role:

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to access this resource.",
  "data": {
    "requiredRole": ["SUPER_ADMIN"],
    "userRole": "USER"
  }
}
```

## Example Route Implementations

### Public Routes

```typescript
router.post("/signup", validateRequest(schema), controller);
router.post("/login", validateRequest(schema), controller);
```

### User Routes (Any authenticated user)

```typescript
router.get("/profile", authenticate, controller);
router.post("/logout", authorize(), controller);
router.post("/posts", authorize("USER"), requireVerifiedAccount, controller);
```

### Admin Routes (Role-based)

```typescript
router.get("/admin/users", authorize("SUPER_ADMIN"), controller);
router.delete(
  "/admin/posts/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  controller
);
```

### Optional Auth Routes

```typescript
router.get("/posts", optionalAuth, controller);
// In controller:
// if (req.user) { /* Show personalized content */ }
// else { /* Show public content */ }
```

## Best Practices

1. **Use `authorize()` for flexibility**: Instead of `authenticate`, use `authorize()` for future role extensions
2. **Chain middleware**: Combine with `requireVerifiedAccount` when needed
3. **Clear role names**: Use enum values from Prisma schema
4. **Handle errors gracefully**: Client should check `data.signOut` to clear local tokens
5. **Test role permissions**: Ensure each role can only access intended routes

## Migration from Old System

**Before:**

```typescript
router.get("/profile", authenticate, controller);
```

**After (same behavior):**

```typescript
router.get("/profile", authorize(), controller);
// or keep using: authenticate
```

**Adding role restrictions:**

```typescript
// Old: authenticate (any user)
router.delete("/users", authenticate, controller);

// New: only admins
router.delete("/users", authorize("SUPER_ADMIN"), controller);
```

## Adding New Roles

1. Update Prisma schema:

```prisma
enum USER_ROLE_ENUM {
    USER
    SUPER_ADMIN
    MODERATOR  // New role
    EDITOR     // New role
}
```

2. Run migration:

```bash
bun run prisma migrate dev --name add_new_roles
```

3. Use in routes:

```typescript
router.post("/moderate", authorize("SUPER_ADMIN", "MODERATOR"), controller);
router.put("/articles/:id", authorize("EDITOR", "SUPER_ADMIN"), controller);
```
