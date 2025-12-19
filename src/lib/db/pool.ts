import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
});

process.on("SIGTERM", async () => {
  await pool.end();
});
