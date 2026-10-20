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

  // Redirect rate limiting (fixed window, keyed by client IP, stored in Redis)
  REDIRECT_RATE_WINDOW_S: z.coerce.number().int().min(1).default(60),
  // Circuit breaker: any GET /:code beyond this per window → 429
  REDIRECT_RATE_ALL_MAX: z.coerce.number().int().min(1).default(300),
  // Strict: cache misses (each = one Postgres lookup) per window → 429
  REDIRECT_RATE_MISS_MAX: z.coerce.number().int().min(1).default(60),
  // Proxy hops to trust for req.ip (0 = off). Set to 1 behind a reverse
  // proxy/load balancer, otherwise every client shares the proxy's IP.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

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
