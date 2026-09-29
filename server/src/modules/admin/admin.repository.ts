import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clickDaily, urls, users } from "../../db/schema.js";

export interface AdminUserRow {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "premium";
  planExpiresAt: Date | null;
  createdAt: Date;
  linkCount: number;
}

export interface AdminLinkRow {
  id: string;
  shortCode: string;
  originalUrl: string;
  userId: string;
  ownerEmail: string | null;
  clicks: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemTotals {
  users: number;
  admins: number;
  newUsers: number;
  links: number;
  activeLinks: number;
  clicks: number;
  clicksToday: number;
}

export interface DayBucket {
  day: string;
  clicks: number;
}

function userSearchCondition(search?: string) {
  if (!search) return undefined;
  return ilike(users.email, `%${search.replace(/[%_\\]/g, "\\$&")}%`);
}

function linkSearchCondition(search?: string) {
  if (!search) return undefined;
  const pattern = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
  return or(ilike(urls.originalUrl, pattern), ilike(urls.shortCode, pattern));
}

export async function listUsers(
  offset: number,
  limit: number,
  search?: string,
): Promise<{ items: AdminUserRow[]; total: number }> {
  const where = userSearchCondition(search);

  const items = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      plan: users.plan,
      planExpiresAt: users.planExpiresAt,
      createdAt: users.createdAt,
      linkCount: count(urls.id),
    })
    .from(users)
    .leftJoin(urls, eq(urls.userId, users.id))
    .where(where)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  return { items, total: totalRow?.total ?? 0 };
}

export async function findUserById(
  id: string,
): Promise<typeof users.$inferSelect | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateUserRole(
  id: string,
  role: "user" | "admin",
): Promise<typeof users.$inferSelect | null> {
  const rows = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning();
  return rows[0] ?? null;
}

/** Collects the user's short codes so callers can bust the redirect cache. */
export async function listUserShortCodes(userId: string): Promise<string[]> {
  const rows = await db
    .select({ shortCode: urls.shortCode })
    .from(urls)
    .where(eq(urls.userId, userId));
  return rows.map((r) => r.shortCode);
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return rows.length > 0;
}

export async function countAdmins(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.role, "admin"));
  return row?.total ?? 0;
}

export async function listLinks(
  offset: number,
  limit: number,
  search?: string,
): Promise<{ items: AdminLinkRow[]; total: number }> {
  const where = linkSearchCondition(search);

  const items = await db
    .select({
      id: urls.id,
      shortCode: urls.shortCode,
      originalUrl: urls.originalUrl,
      userId: urls.userId,
      ownerEmail: users.email,
      clicks: urls.clicks,
      expiresAt: urls.expiresAt,
      createdAt: urls.createdAt,
      updatedAt: urls.updatedAt,
    })
    .from(urls)
    .leftJoin(users, eq(users.id, urls.userId))
    .where(where)
    .orderBy(desc(urls.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(urls)
    .where(where);

  return { items, total: totalRow?.total ?? 0 };
}

export async function findLinkById(
  id: string,
): Promise<typeof urls.$inferSelect | null> {
  const rows = await db
    .select()
    .from(urls)
    .where(eq(urls.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Ownership-free delete — admin removal of inappropriate links. */
export async function removeLink(id: string): Promise<boolean> {
  const rows = await db
    .delete(urls)
    .where(eq(urls.id, id))
    .returning({ id: urls.id });
  return rows.length > 0;
}

export async function getSystemTotals(
  today: string,
  newUsersSince: Date,
): Promise<SystemTotals> {
  const [userRow] = await db
    .select({
      users: count(),
      admins: sql<number>`count(*) filter (where ${users.role} = 'admin')::int`,
      newUsers: sql<number>`count(*) filter (where ${users.createdAt} >= ${newUsersSince})::int`,
    })
    .from(users);

  const [linkRow] = await db
    .select({
      links: count(),
      clicks: sql<number>`coalesce(sum(${urls.clicks}), 0)::int`,
      activeLinks: sql<number>`coalesce(
        count(*) filter (
          where ${urls.expiresAt} is null or ${urls.expiresAt} > now()
        ), 0)::int`,
    })
    .from(urls);

  const [todayRow] = await db
    .select({
      clicks: sql<number>`coalesce(sum(${clickDaily.clicks}), 0)::int`,
    })
    .from(clickDaily)
    .where(eq(clickDaily.day, today));

  return {
    users: userRow?.users ?? 0,
    admins: userRow?.admins ?? 0,
    newUsers: userRow?.newUsers ?? 0,
    links: linkRow?.links ?? 0,
    activeLinks: linkRow?.activeLinks ?? 0,
    clicks: linkRow?.clicks ?? 0,
    clicksToday: todayRow?.clicks ?? 0,
  };
}

export async function getSystemSeries(fromDay: string): Promise<DayBucket[]> {
  return db
    .select({
      day: clickDaily.day,
      clicks: sql<number>`sum(${clickDaily.clicks})::int`,
    })
    .from(clickDaily)
    .where(gte(clickDaily.day, fromDay))
    .groupBy(clickDaily.day)
    .orderBy(asc(clickDaily.day));
}

export async function getTopLinks(limit: number): Promise<
  (typeof urls.$inferSelect)[]
> {
  return db
    .select()
    .from(urls)
    .orderBy(desc(urls.clicks), desc(urls.createdAt))
    .limit(limit);
}
