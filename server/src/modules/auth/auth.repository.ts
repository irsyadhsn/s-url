import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { type NewUser, users } from "../../db/schema.js";

export async function findByEmail(
  email: string,
): Promise<typeof users.$inferSelect | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function findById(
  id: string,
): Promise<typeof users.$inferSelect | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(
  payload: NewUser,
): Promise<typeof users.$inferSelect> {
  const rows = await db.insert(users).values(payload).returning();
  return rows[0]!;
}