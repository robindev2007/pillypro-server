import chalk from "chalk";
import "dotenv/config";
import { z } from "zod";

// ---------------- ENV VALIDATION SCHEMA ----------------
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PROJECT_NAME: z.string().min(1, "PROJECT_NAME is required"),
  PORT: z.coerce.number().positive().max(65535).default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SUPER_ADMIN_PASSWORD: z.string().min(6, "SUPER_ADMIN_PASSWORD is required"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  MAIL_HOST: z.string().min(1, "MAIL_HOST is required"),
  MAIL_PORT: z.coerce.number().positive().max(65535),
  MAIL_USER: z.string().min(1, "MAIL_USER is required"),
  MAIL_PASS: z.string().min(1, "MAIL_PASS is required"),
  MAIL_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  BASE_URL_CLIENT_DEV: z.string().url(),
  BASE_URL_SERVER_DEV: z.string().url(),
  BASE_URL_CLIENT: z.string().url(),
  BASE_URL_SERVER: z.string().url(),

  REDIS_URL: z.string().optional(),

  REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
  REDIS_PORT: z.coerce.number().positive().max(65535),
  REDIS_PASSWORD: z.string().min(1, "REDIS_PASSWORD is required"),
});

// ---------------- TYPE FOR PARSED ENV ----------------
type EnvBase = z.infer<typeof EnvSchema>;

interface EnvType extends EnvBase {
  FRONTEND_URL: string;
  SERVER_URL: string;
  isDevelopment: boolean;
}

// ---------------- PARSE AND DERIVE ----------------
let env: EnvType;

try {
  const parsedEnv = EnvSchema.parse(process.env);

  const isDevelopment = parsedEnv.NODE_ENV === "development";

  env = {
    ...parsedEnv,
    FRONTEND_URL: isDevelopment
      ? parsedEnv.BASE_URL_CLIENT_DEV
      : parsedEnv.BASE_URL_CLIENT,
    SERVER_URL: isDevelopment
      ? parsedEnv.BASE_URL_SERVER_DEV
      : parsedEnv.BASE_URL_SERVER,
    isDevelopment,
  };
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(
      chalk.bgRedBright.white.bold("\n ❌ ENV VALIDATION FAILED ❌ \n")
    );
    console.log(chalk.yellow("Please fix your .env file:\n"));

    err.issues.forEach((e) => {
      console.log(
        chalk.yellow("• ") +
          chalk.cyanBright(e.path.join(".")) +
          chalk.redBright(` → ${e.message}`)
      );
    });

    console.log(chalk.magentaBright("\nExiting application.\n"));
    process.exit(1);
  } else {
    throw err;
  }
}

// ---------------- EXPORT ----------------
export default env;
