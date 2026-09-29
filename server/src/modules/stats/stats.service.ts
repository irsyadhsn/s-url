import { env } from "../../config/env.js";
import * as linkRepo from "../links/links.repository.js";
import { flushForRead } from "../redirect/redirect.service.js";
import { ApiError } from "../../utils/errors.js";
import * as statsRepo from "./stats.repository.js";

const TOP_LINKS_LIMIT = 5;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Dense zero-filled series so the graph always has every bucket. */
function zeroFill(
  fromDay: string,
  rows: statsRepo.DayBucket[],
): statsRepo.DayBucket[] {
  const map = new Map(rows.map((r) => [r.day, r.clicks]));
  const out: statsRepo.DayBucket[] = [];
  const end = Date.parse(`${utcDay()}T00:00:00Z`);
  for (
    let t = Date.parse(`${fromDay}T00:00:00Z`);
    t <= end;
    t += 86_400_000
  ) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push({ day, clicks: map.get(day) ?? 0 });
  }
  return out;
}

function withShortUrl<T extends { shortCode: string }>(link: T) {
  return { ...link, shortUrl: `${env.SHORT_URL_BASE}/${link.shortCode}` };
}

export async function getOverview(userId: string, days: number) {
  await flushForRead();
  const today = utcDay();
  const fromDay = dayOffset(days - 1);

  const [totals, series, topLinks] = await Promise.all([
    statsRepo.getTotals(userId, today),
    statsRepo.getSeries(userId, fromDay),
    statsRepo.getTopLinks(userId, TOP_LINKS_LIMIT),
  ]);

  return {
    totals,
    series: zeroFill(fromDay, series),
    topLinks: topLinks.map(withShortUrl),
  };
}

export async function getLinkStats(userId: string, linkId: string, days: number) {
  await flushForRead();
  const link = await linkRepo.findOwnedById(linkId, userId);
  if (!link) {
    throw ApiError.notFound("Link not found");
  }

  const today = utcDay();
  const fromDay = dayOffset(days - 1);

  const [series, clicksToday] = await Promise.all([
    statsRepo.getLinkSeries(link.id, fromDay),
    statsRepo.getLinkClicksToday(link.id, today),
  ]);

  const filled = zeroFill(fromDay, series);
  const clicksInRange = filled.reduce((sum, b) => sum + b.clicks, 0);
  const peak = filled.reduce((max, b) => Math.max(max, b.clicks), 0);

  const daysActive = Math.max(
    1,
    Math.ceil(
      (Date.now() - Date.parse(link.createdAt.toISOString())) / 86_400_000,
    ),
  );

  return {
    link: withShortUrl(link),
    stats: {
      totalClicks: link.clicks,
      clicksToday,
      clicksInRange,
      avgPerDay: Math.round((link.clicks / daysActive) * 10) / 10,
      peakDayClicks: peak,
      daysActive,
    },
    series: filled,
  };
}
