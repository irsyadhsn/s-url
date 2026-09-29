import { env } from "../../config/env.js";
import * as redirectCache from "../redirect/redirect.cache.js";
import { flushForRead } from "../redirect/redirect.service.js";
import { ApiError } from "../../utils/errors.js";
import { toPublicUser } from "../auth/auth.service.js";
import type {
  ListLinksQuery,
  ListUsersQuery,
  OverviewQuery,
} from "./admin.schemas.js";
import * as adminRepo from "./admin.repository.js";

const TOP_LINKS_LIMIT = 5;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function withShortUrl<T extends { shortCode: string }>(link: T) {
  return { ...link, shortUrl: `${env.SHORT_URL_BASE}/${link.shortCode}` };
}

/** Dense zero-filled series so the chart always has every bucket. */
function zeroFill(fromDay: string, rows: adminRepo.DayBucket[]) {
  const map = new Map(rows.map((r) => [r.day, r.clicks]));
  const out: adminRepo.DayBucket[] = [];
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

function meta(page: number, pageSize: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
  };
}

export async function listUsers(query: ListUsersQuery) {
  const { page, pageSize, search } = query;
  const { items, total } = await adminRepo.listUsers(
    (page - 1) * pageSize,
    pageSize,
    search,
  );
  return {
    items: items.map((u) => ({
      ...toPublicUser(u),
      linkCount: u.linkCount,
    })),
    meta: meta(page, pageSize, total),
  };
}

export async function updateUserRole(
  actorId: string,
  targetId: string,
  role: "user" | "admin",
) {
  if (actorId === targetId) {
    throw ApiError.badRequest(
      "You cannot change your own role",
      "CANNOT_CHANGE_OWN_ROLE",
    );
  }

  const existing = await adminRepo.findUserById(targetId);
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (existing.role === "admin" && role === "user") {
    const adminCount = await adminRepo.countAdmins();
    if (adminCount <= 1) {
      throw ApiError.badRequest(
        "Cannot demote the last admin",
        "LAST_ADMIN",
      );
    }
  }

  const updated = await adminRepo.updateUserRole(targetId, role);
  return toPublicUser(updated!);
}

export async function deleteUser(actorId: string, targetId: string) {
  if (actorId === targetId) {
    throw ApiError.badRequest(
      "You cannot delete your own account here",
      "CANNOT_DELETE_SELF",
    );
  }

  const existing = await adminRepo.findUserById(targetId);
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (existing.role === "admin") {
    const adminCount = await adminRepo.countAdmins();
    if (adminCount <= 1) {
      throw ApiError.badRequest("Cannot delete the last admin", "LAST_ADMIN");
    }
  }

  const shortCodes = await adminRepo.listUserShortCodes(targetId);
  await adminRepo.deleteUser(targetId);
  await Promise.all(shortCodes.map((code) => redirectCache.del(code)));
}

export async function listLinks(query: ListLinksQuery) {
  await flushForRead();
  const { page, pageSize, search } = query;
  const { items, total } = await adminRepo.listLinks(
    (page - 1) * pageSize,
    pageSize,
    search,
  );
  return {
    items: items.map((link) => ({
      ...link,
      shortUrl: `${env.SHORT_URL_BASE}/${link.shortCode}`,
    })),
    meta: meta(page, pageSize, total),
  };
}

/** Removes any user's link — admin takedown of inappropriate content. */
export async function deleteLink(linkId: string): Promise<void> {
  const existing = await adminRepo.findLinkById(linkId);
  if (!existing) {
    throw ApiError.notFound("Link not found");
  }

  await adminRepo.removeLink(linkId);
  await redirectCache.del(existing.shortCode);
}

export async function getOverview(query: OverviewQuery) {
  await flushForRead();
  const { days } = query;
  const today = utcDay();
  const fromDay = dayOffset(days - 1);
  const newUsersSince = new Date(Date.now() - 7 * 86_400_000);

  const [totals, series, topLinks] = await Promise.all([
    adminRepo.getSystemTotals(today, newUsersSince),
    adminRepo.getSystemSeries(fromDay),
    adminRepo.getTopLinks(TOP_LINKS_LIMIT),
  ]);

  return {
    totals,
    series: zeroFill(fromDay, series),
    topLinks: topLinks.map(withShortUrl),
  };
}
