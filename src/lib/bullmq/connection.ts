// src/lib/bullmq/connection.ts
import env from "@/config/env";
import { ConnectionOptions } from "bullmq";

export const redisConnection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
};
