import { redis } from "../../db/redis.js";
import * as redirectCache from "./redirect.cache.js";
import * as redirectRepository from "./redirect.repository.js";

export type ResolveOutcome =
  | { kind: "link"; originalUrl: string; shortCode: string }
  | { kind: "expired" }
  | { kind: "missing" };

const CLICKS_PREFIX = "clicks:";
const CLICKS_PENDING = "clicks:pending";

/** UTC day (YYYY-MM-DD) used to bucket clicks for the dashboard graph. */
function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically claim counts: GET → DEL → SREM per key.
 * Data is only destroyed here AFTER we've captured it into `counts`;
 * if the subsequent DB transaction fails we INCRBY/SREM back (see doFlush).
 */
const POP_SCRIPT = `
local res = {}
for i, key in ipairs(KEYS) do
  local c = tonumber(redis.call('GET', key) or '0')
  redis.call('DEL', key)
  redis.call('SREM', ARGV[1], string.sub(key, #ARGV[2] + 1))
  res[i] = c
end
return res
`;

export async function resolve(code: string): Promise<ResolveOutcome> {
  const cached = await redirectCache.get(code);
  if (cached) {
    if (cached.expiresAt && Date.parse(cached.expiresAt) <= Date.now()) {
      await redirectCache.del(code);
      return { kind: "expired" };
    }
    return { kind: "link", originalUrl: cached.originalUrl, shortCode: code };
  }

  const row = await redirectRepository.findByShortCode(code);
  if (!row) {
    return { kind: "missing" };
  }

  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    await redirectCache.del(code);
    return { kind: "expired" };
  }

  await redirectCache.set(code, {
    originalUrl: row.originalUrl,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  });

  return { kind: "link", originalUrl: row.originalUrl, shortCode: code };
}

export async function recordClick(code: string): Promise<void> {
  try {
    // Bucket by UTC day so flush can attribute counts to click_daily rows.
    await redis
      .pipeline()
      .incr(`${CLICKS_PREFIX}${code}:${utcDay()}`)
      .sadd(CLICKS_PENDING, `${code}:${utcDay()}`)
      .exec();
  } catch (err) {
    // Never fail the redirect, but make Redis outages visible in logs.
    console.error(
      "[record-click] redis write failed",
      code,
      err instanceof Error ? err.message : String(err),
    );
  }
}

interface Claim {
  member: string;
  key: string;
  code: string;
  day: string;
  count: number;
}

// Single in-flight flush — concurrent calls join the same promise (no pile-up).
let flushInFlight: Promise<number> | null = null;

/**
 * Flush Redis click counters → Postgres.
 * Crash-safe: claim counts atomically, write in one transaction,
 * restore to Redis if the DB write fails (no silent loss).
 */
export function flushPendingClicks(): Promise<number> {
  if (flushInFlight) return flushInFlight;
  flushInFlight = doFlush().finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

async function doFlush(): Promise<number> {
  const pending = await redis.smembers(CLICKS_PENDING);
  if (pending.length === 0) {
    return 0;
  }

  const keys = pending.map((member) => `${CLICKS_PREFIX}${member}`);
  const counts = (await redis.eval(
    POP_SCRIPT,
    keys.length,
    ...keys,
    CLICKS_PENDING,
    CLICKS_PREFIX,
  )) as number[];

  const claims: Claim[] = [];
  for (let i = 0; i < pending.length; i++) {
    const count = Number(counts[i]);
    if (count <= 0) continue;

    // member is "<shortCode>:<YYYY-MM-DD>" (legacy members may lack ":day").
    const member = pending[i]!;
    const sep = member.lastIndexOf(":");
    const hasDay = sep > 0 && /^\d{4}-\d{2}-\d{2}$/.test(member.slice(sep + 1));
    claims.push({
      member,
      key: keys[i]!,
      code: hasDay ? member.slice(0, sep) : member,
      day: hasDay ? member.slice(sep + 1) : utcDay(),
      count,
    });
  }

  if (claims.length === 0) {
    return 0;
  }

  try {
    await redirectRepository.applyClicksBatch(claims);
  } catch (err) {
    // DB write failed after we already popped Redis — put the counts back
    // so the next flush retries instead of losing clicks permanently.
    await Promise.all(
      claims.map(async (c) => {
        try {
          await redis.incrby(c.key, c.count);
          await redis.sadd(CLICKS_PENDING, c.member);
        } catch (restoreErr) {
          console.error(
            "[click-sync] failed to restore claim",
            c.member,
            restoreErr instanceof Error ? restoreErr.message : String(restoreErr),
          );
        }
      }),
    );
    throw err;
  }

  return claims.reduce((sum, c) => sum + c.count, 0);
}

/**
 * Best-effort flush for read paths (list/stats) so API responses include
 * the latest Redis counts instead of waiting for the background interval.
 * Errors are logged but never fail the caller's request.
 */
export async function flushForRead(): Promise<void> {
  try {
    await flushPendingClicks();
  } catch (err) {
    console.error(
      "[flush-on-read] failed",
      err instanceof Error ? err.message : String(err),
    );
  }
}
