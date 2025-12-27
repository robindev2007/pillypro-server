// src/lib/bullmq/queue.ts
import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const reminderQueue = new Queue("reminder-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  },
});
