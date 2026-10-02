import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  type NewPayment,
  type Payment,
  type User,
  payments,
  urls,
  users,
} from "../../db/schema.js";

export async function countCustomAliases(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(urls)
    .where(and(eq(urls.userId, userId), eq(urls.isCustomAlias, true)));
  return row?.total ?? 0;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listPayments(
  userId: string,
  limit = 20,
): Promise<Payment[]> {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function purchasePremium(
  userId: string,
  params: {
    reference: string;
    amountCents: number;
    currency: string;
    planExpiresAt: Date;
  },
): Promise<{ user: User; payment: Payment }> {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ plan: "premium", planExpiresAt: params.planExpiresAt })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new Error(`User ${userId} disappeared during checkout`);
    }

    const paymentPayload: NewPayment = {
      userId,
      plan: "premium",
      amountCents: params.amountCents,
      currency: params.currency,
      reference: params.reference,
      status: "succeeded",
      planExpiresAt: params.planExpiresAt,
    };
    const [payment] = await tx
      .insert(payments)
      .values(paymentPayload)
      .returning();

    return { user: updated, payment: payment! };
  });
}
