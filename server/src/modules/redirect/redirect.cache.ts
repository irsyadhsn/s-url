import { redis } from "../../db/redis.js";

const CACHE_PREFIX = "redirect:";
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export interface CachedEntry {
  originalUrl: string;
  expiresAt: string | null;
}

function cacheKey(code: string): string {
  return `${CACHE_PREFIX}${code}`;
}

export async function get(code: string): Promise<CachedEntry | null> {
  try {
    const raw = await redis.get(cacheKey(code));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CachedEntry;
  } catch {
    return null;
  }
}

export async function set(code: string, entry: CachedEntry): Promise<void> {
  try {
    await redis.set(
      cacheKey(code),
      JSON.stringify(entry),
      "EX",
      CACHE_TTL_SECONDS,
    );
  } catch {
    return;
  }
}

export async function del(code: string): Promise<void> {
  try {
    await redis.del(cacheKey(code));
  } catch {
    return;
  }
}
