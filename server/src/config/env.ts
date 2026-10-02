import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  REDIS_TLS: z.coerce.boolean().default(false),
  CLICK_SYNC_INTERVAL_MS: z.coerce.number().int().min(1_000).default(1_000),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(ms|s|m|h|d)$/, "Invalid duration (use e.g. 15m, 1h, 7d)")
    .default("1h"),

  SHORT_URL_BASE: z
    .string()
    .url("SHORT_URL_BASE must be a valid URL")
    .default("https://surl")
    .transform((v) => v.replace(/\/+$/, "")),

  FRONTEND_URL: z
    .string()
    .url("FRONTEND_URL must be a valid URL")
    .optional()
    .transform((v) => v?.replace(/\/+$/, "")),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
