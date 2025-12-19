# Token Cleanup Job - Performance & Production Guide

## Current Implementation

### ✅ What's Good

- **Non-blocking**: Cleanup runs asynchronously using `Promise.all()`
- **Delayed start**: First run after 5 minutes (doesn't block server startup)
- **Error handling**: Catches errors without crashing the server
- **Logging**: Tracks cleanup operations

### ⚠️ Considerations

- Uses `setInterval` (simple but not ideal for production)
- Runs in-process (all server instances will run cleanup)
- No distributed locking (could cause duplicate cleanups in multi-instance setup)

## Performance Analysis

### Will it Block Requests? ❌ NO

```typescript
// Cleanup runs async in background
setTimeout(() => {
  runCleanupTask(); // Doesn't block event loop
}, 5 * 60 * 1000);
```

**Why it doesn't block:**

1. Uses `async/await` - runs in background
2. Prisma queries are non-blocking
3. `Promise.all()` parallelizes token + OTP cleanup
4. First run delayed by 5 minutes after startup

### Database Impact

- **Query complexity**: Simple `DELETE` with indexed `expiresAt` field
- **Expected records**: ~100-1000 expired tokens per hour (typical)
- **Query time**: ~10-50ms (with proper indexes)
- **Lock duration**: Minimal (row-level locks in PostgreSQL)

## Production Recommendations

### Option 1: node-cron (Simple, Recommended for Small-Medium Scale)

```bash
bun add node-cron
```

```typescript
// src/utils/tokenCleanup.ts
import cron from "node-cron";

export const startTokenCleanupJob = () => {
  // Runs every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    logger.info("🧹 Starting scheduled cleanup task...");
    await runCleanupTask();
  });

  logger.info("🧹 Token cleanup cron job scheduled (every hour)");
};
```

**Pros:**

- ✅ Cron syntax (familiar)
- ✅ Timezone support
- ✅ Easy to use
- ✅ No external dependencies

**Cons:**

- ❌ Runs in every server instance
- ❌ No distributed locking
- ❌ No job queue

### Option 2: Bull/BullMQ (Scalable, Redis-based)

```bash
bun add bullmq ioredis
```

```typescript
// src/jobs/cleanupQueue.ts
import { Queue, Worker } from "bullmq";

const cleanupQueue = new Queue("cleanup", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

// Schedule job to run every hour
await cleanupQueue.add(
  "token-cleanup",
  {},
  {
    repeat: {
      pattern: "0 * * * *", // Every hour
    },
  }
);

// Worker processes the job
const worker = new Worker(
  "cleanup",
  async (job) => {
    await runCleanupTask();
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);
```

**Pros:**

- ✅ Distributed (only one instance runs job)
- ✅ Job persistence (survives restarts)
- ✅ Retry logic
- ✅ Job monitoring/dashboard
- ✅ Scalable

**Cons:**

- ❌ Requires Redis
- ❌ More complex setup

### Option 3: Separate Cron Service (Best for Large Scale)

Deploy a separate microservice or use cloud cron:

**Kubernetes CronJob:**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: token-cleanup
spec:
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: your-app:latest
              command: ["node", "dist/scripts/cleanup.js"]
```

**AWS EventBridge + Lambda:**

- Create Lambda function with cleanup logic
- Schedule with EventBridge (every hour)

**Pros:**

- ✅ Completely separate from API servers
- ✅ No impact on API performance
- ✅ Easy to scale independently
- ✅ Cloud-native monitoring

**Cons:**

- ❌ More infrastructure
- ❌ Additional deployment complexity

## Database Optimization

### Add Indexes (Critical!)

```prisma
model ExpiredTokens {
  id        String   @id @default(cuid())
  expiresAt DateTime
  // ... other fields

  @@index([expiresAt]) // Important for cleanup performance!
  @@map("expired_tokens")
}

model OTP {
  id        String   @id @default(cuid())
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([expiresAt])        // For expired OTP cleanup
  @@index([isRevoked, createdAt]) // For revoked OTP cleanup
  @@map("otps")
}
```

Run migration:

```bash
bun prisma migrate dev --name add_cleanup_indexes
```

### Monitor Query Performance

```typescript
// Enable Prisma query logging in development
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"] // Enable query tracing
}
```

## Manual Cleanup API (Optional)

Add an admin endpoint for manual cleanup:

```typescript
// src/app/admin/admin.controller.ts
import { manualCleanup } from "@/utils/tokenCleanup";

export const triggerCleanup = async (req: Request, res: Response) => {
  const result = await manualCleanup();

  res.json({
    success: true,
    message: "Cleanup completed",
    data: result,
  });
};

// src/app/admin/admin.route.ts
router.post(
  "/cleanup/tokens",
  authorize("SUPER_ADMIN"),
  AdminController.triggerCleanup
);
```

## Monitoring & Alerts

### Log Cleanup Metrics

```typescript
const runCleanupTask = async (): Promise<void> => {
  const startTime = Date.now();

  try {
    logger.info("🧹 Starting scheduled cleanup task...");
    const result = await manualCleanup();
    const duration = Date.now() - startTime;

    logger.info(`✅ Cleanup completed in ${duration}ms`, {
      tokensDeleted: result.tokensDeleted,
      otpsDeleted: result.otpsDeleted,
      duration,
    });

    // Alert if cleanup takes too long
    if (duration > 5000) {
      logger.warn(`⚠️ Cleanup took ${duration}ms - consider optimization`);
    }
  } catch (error) {
    logger.error(`❌ Cleanup task failed: ${error}`);
    // Send alert to monitoring service (Sentry, etc.)
  }
};
```

## Recommendation Summary

| Scale                        | Recommendation        | Why                              |
| ---------------------------- | --------------------- | -------------------------------- |
| **Small** (< 1000 users)     | Current `setInterval` | Simple, works fine               |
| **Medium** (< 10k users)     | `node-cron`           | Better scheduling, minimal setup |
| **Large** (< 100k users)     | `BullMQ` + Redis      | Distributed, reliable            |
| **Enterprise** (100k+ users) | Separate cron service | Isolated, scalable               |

## Current Status: ✅ SAFE FOR PRODUCTION

The current implementation:

- ✅ Won't block requests
- ✅ Handles errors gracefully
- ✅ Runs in background
- ✅ Doesn't impact startup time

**Action Items:**

1. ✅ **Immediate**: Add database indexes (run migration)
2. ⚠️ **Soon**: Switch to `node-cron` for better scheduling
3. 📈 **Later**: Consider BullMQ when scaling beyond single instance
