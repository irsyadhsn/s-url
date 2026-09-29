import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { type NewUrl, urls } from "../../db/schema.js";

export async function create(
  payload: NewUrl,
): Promise<typeof urls.$inferSelect> {
  const rows = await db.insert(urls).values(payload).returning();
  return rows[0]!;
}

export async function findOwnedById(
  id: string,
  userId: string,
): Promise<typeof urls.$inferSelect | null> {
  const rows = await db
    .select()
    .from(urls)
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listByUserId(
  userId: string,
  offset: number,
  limit: number,
): Promise<{ items: (typeof urls.$inferSelect)[]; total: number }> {
  const items = await db
    .select()
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(urls)
    .where(eq(urls.userId, userId));

  return { items, total: totalRow?.total ?? 0 };
}

export async function update(
  id: string,
  userId: string,
  payload: Partial<NewUrl>,
): Promise<typeof urls.$inferSelect | null> {
  const rows = await db
    .update(urls)
    .set({ ...payload, updatedAt: new Date() })
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function remove(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(urls)
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .returning({ id: urls.id });
  return rows.length > 0;
}

/** How many of the user's links currently use a chosen (custom) alias. */
export async function countCustomAliases(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(urls)
    .where(and(eq(urls.userId, userId), eq(urls.isCustomAlias, true)));
  return row?.total ?? 0;
}