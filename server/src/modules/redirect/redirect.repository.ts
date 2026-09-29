import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clickDaily, urls } from "../../db/schema.js";

export async function findByShortCode(
  code: string,
): Promise<typeof urls.$inferSelect | null> {
  const rows = await db
    .select()
    .from(urls)
    .where(sql`${urls.shortCode} = ${code}`)
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Atomically bump urls.clicks and upsert click_daily in ONE statement
 * (implicit transaction) so totals and the chart can never diverge.
 * No-op if the short code no longer exists (link deleted mid-flight).
 */
export async function applyClicks(
  code: string,
  day: string,
  by: number,
): Promise<void> {
  await db.execute(sql`
    WITH target AS (
      UPDATE urls SET clicks = clicks + ${by}
      WHERE short_code = ${code}
      RETURNING id
    )
    INSERT INTO click_daily (url_id, day, clicks)
    SELECT id, ${day}::date, ${by} FROM target
    ON CONFLICT (url_id, day)
    DO UPDATE SET clicks = click_daily.clicks + EXCLUDED.clicks
  `);
}

/** Apply many claims in a single DB transaction (all-or-nothing). */
export async function applyClicksBatch(
  claims: { code: string; day: string; count: number }[],
): Promise<void> {
  if (claims.length === 0) return;
  await db.transaction(async (tx) => {
    for (const c of claims) {
      await tx.execute(sql`
        WITH target AS (
          UPDATE urls SET clicks = clicks + ${c.count}
          WHERE short_code = ${c.code}
          RETURNING id
        )
        INSERT INTO click_daily (url_id, day, clicks)
        SELECT id, ${c.day}::date, ${c.count} FROM target
        ON CONFLICT (url_id, day)
        DO UPDATE SET clicks = click_daily.clicks + EXCLUDED.clicks
      `);
    }
  });
}
