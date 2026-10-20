import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { redis } from "../db/redis.js";
import { ApiError } from "../utils/errors.js";

/**
 * Fixed-window counter: INCR, and only set the TTL when the key is born.
 * Fail-open — if Redis is unavailable the request is allowed through, so the
 * limiter can never take redirects down (same philosophy as the redirect
 * cache, which serves without it).
 */
const WINDOW_SCRIPT = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return n
`;

async function windowHit(key: string): Promise<number> {
  try {
    return (await redis.eval(
      WINDOW_SCRIPT,
      1,
      key,
      String(env.REDIRECT_RATE_WINDOW_S),
    )) as number;
  } catch (err) {
    console.error(
      "[rate-limit] redis unavailable, allowing request",
      err instanceof Error ? err.message : String(err),
    );
    return 0;
  }
}

/**
 * Strict per-IP limit on cache misses — every miss costs one Postgres
 * lookup, and unbounded `GET /random` probing is the real DoS surface.
 * Called from the redirect service *before* the DB query. Resolvable,
 * already-cached links never touch this counter.
 */
export async function overRedirectMissLimit(ip: string): Promise<boolean> {
  const n = await windowHit(`rl:redir:miss:${ip}`);
  return n > env.REDIRECT_RATE_MISS_MAX;
}

/**
 * High ceiling on *all* redirect requests per IP — a circuit breaker only
 * trip by actual abuse (a viral link stays 302 well below it).
 */
export const redirectLimiter: RequestHandler = async (req, res, next) => {
  const n = await windowHit(`rl:redir:all:${req.ip ?? "unknown"}`);
  if (n > env.REDIRECT_RATE_ALL_MAX) {
    res.set("Retry-After", String(env.REDIRECT_RATE_WINDOW_S));
    next(ApiError.tooManyRequests("Too many redirect requests"));
    return;
  }
  next();
};
