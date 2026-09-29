/**
 * Backfill click_daily with plausible history for the last 13 full UTC days
 * so the dashboard chart has data on a fresh dev database.
 *
 * Idempotent: wipes past-day rows, reseeds, and adjusts urls.clicks so
 * total clicks stay consistent with sum(daily). Today's rows are untouched
 * (they come from the live Redis flush).
 *
 * Usage: npm run db:seed:clicks
 */
import { sql } from "drizzle-orm";
import { clickDaily, urls } from "../src/db/schema.js";
import { db, pool } from "../src/db/index.js";

const PAST_DAYS = 13;
const MAX_PER_DAY = 14;

function utcDayKey(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const today = utcDayKey(0);

  // 1) Remove existing past rows; remember their sums per link.
  const pastRows = await db
    .select({ urlId: clickDaily.urlId, clicks: clickDaily.clicks })
    .from(clickDaily)
    .where(sql`${clickDaily.day} < ${today}`);

  const oldSums = new Map<string, number>();
  for (const row of pastRows) {
    oldSums.set(row.urlId, (oldSums.get(row.urlId) ?? 0) + row.clicks);
  }
  await db.delete(clickDaily).where(sql`${clickDaily.day} < ${today}`);

  // 2) Subtract what we removed so totals don't double-count across reseeds.
  for (const [urlId, s] of oldSums) {
    await db
      .update(urls)
      .set({ clicks: sql`greatest(${urls.clicks} - ${s}, 0)` })
      .where(sql`${urls.id} = ${urlId}`);
  }

  // 3) Reseed 13 past days for every link (ignores createdAt — dev data).
  const allLinks = await db
    .select({ id: urls.id, clicks: urls.clicks })
    .from(urls);

  const rows: { urlId: string; day: string; clicks: number }[] = [];
  for (const link of allLinks) {
    // Bias older days lower so the chart has an upward "trend".
    for (let offset = -PAST_DAYS; offset <= -1; offset++) {
      const day = utcDayKey(offset);
      const ageFactor = (PAST_DAYS + 1 + offset) / (PAST_DAYS + 1); // ~0.1..0.9
      const raw = Math.random() * MAX_PER_DAY * ageFactor;
      const clicks = Math.floor(raw);
      if (clicks <= 0) continue;
      rows.push({ urlId: link.id, day, clicks });
    }
  }

  const newSums = new Map<string, number>();
  for (const row of rows) {
    newSums.set(row.urlId, (newSums.get(row.urlId) ?? 0) + row.clicks);
  }

  if (rows.length > 0) {
    await db.insert(clickDaily).values(rows).onConflictDoNothing();
    for (const [urlId, s] of newSums) {
      await db
        .update(urls)
        .set({ clicks: sql`${urls.clicks} + ${s}` })
        .where(sql`${urls.id} = ${urlId}`);
    }
  }

  const totalSeeded = rows.reduce((sum, r) => sum + r.clicks, 0);
  console.log(
    `Seeded ${rows.length} day-rows (+${totalSeeded} clicks) across ${newSums.size} links (past ${PAST_DAYS} days, before ${today}).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
