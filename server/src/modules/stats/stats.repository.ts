import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clickDaily, urls } from "../../db/schema.js";

export interface OverviewTotals {
  links: number;
  clicks: number;
  activeLinks: number;
  clicksToday: number;
}

export interface DayBucket {
  day: string;
  clicks: number;
}

export async function getTotals(
  userId: string,
  today: string,
): Promise<OverviewTotals> {
  const [row] = await db
    .select({
      links: count(),
      clicks: sql<number>`coalesce(sum(${urls.clicks}), 0)::int`,
      activeLinks: sql<number>`coalesce(
        count(*) filter (
          where ${urls.expiresAt} is null or ${urls.expiresAt} > now()
        ), 0)::int`,
    })
    .from(urls)
    .where(eq(urls.userId, userId));

  const [todayRow] = await db
    .select({ clicks: sql<number>`coalesce(sum(${clickDaily.clicks}), 0)::int` })
    .from(clickDaily)
    .innerJoin(urls, eq(clickDaily.urlId, urls.id))
    .where(and(eq(urls.userId, userId), eq(clickDaily.day, today)));

  return {
    links: row?.links ?? 0,
    clicks: row?.clicks ?? 0,
    activeLinks: row?.activeLinks ?? 0,
    clicksToday: todayRow?.clicks ?? 0,
  };
}

export async function getSeries(
  userId: string,
  fromDay: string,
): Promise<DayBucket[]> {
  return db
    .select({
      day: clickDaily.day,
      clicks: sql<number>`sum(${clickDaily.clicks})::int`,
    })
    .from(clickDaily)
    .innerJoin(urls, eq(clickDaily.urlId, urls.id))
    .where(and(eq(urls.userId, userId), gte(clickDaily.day, fromDay)))
    .groupBy(clickDaily.day)
    .orderBy(asc(clickDaily.day));
}

export async function getTopLinks(
  userId: string,
  limit: number,
): Promise<(typeof urls.$inferSelect)[]> {
  return db
    .select()
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.clicks), desc(urls.createdAt))
    .limit(limit);
}

export async function getLinkSeries(
  urlId: string,
  fromDay: string,
): Promise<DayBucket[]> {
  return db
    .select({ day: clickDaily.day, clicks: clickDaily.clicks })
    .from(clickDaily)
    .where(and(eq(clickDaily.urlId, urlId), gte(clickDaily.day, fromDay)))
    .orderBy(asc(clickDaily.day));
}

export async function getLinkClicksToday(
  urlId: string,
  today: string,
): Promise<number> {
  const [row] = await db
    .select({ clicks: clickDaily.clicks })
    .from(clickDaily)
    .where(and(eq(clickDaily.urlId, urlId), eq(clickDaily.day, today)))
    .limit(1);
  return row?.clicks ?? 0;
}
