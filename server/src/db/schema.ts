import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const userPlanEnum = pgEnum("user_plan", ["free", "premium"]);

export type UserPlan = (typeof userPlanEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
]);

export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    plan: userPlanEnum("plan").notNull().default("free"),
    // Null on the free plan; set (and extended) by successful checkouts.
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export const urls = pgTable(
  "urls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shortCode: text("short_code").notNull(),
    originalUrl: text("original_url").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clicks: integer("clicks").default(0).notNull(),
    /**
     * True when the short code was chosen by the user (vs generated).
     * Drives the free plan's "5 custom aliases at a time" quota.
     */
    isCustomAlias: boolean("is_custom_alias").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("urls_short_code_unique").on(table.shortCode),
    index("urls_user_id_idx").on(table.userId),
    index("urls_expires_at_idx").on(table.expiresAt),
  ],
);

/** Per-link clicks per UTC day — powers the dashboard graph. */
export const clickDaily = pgTable(
  "click_daily",
  {
    urlId: uuid("url_id")
      .notNull()
      .references(() => urls.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    clicks: integer("clicks").default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.urlId, table.day] }),
    index("click_daily_day_idx").on(table.day),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Url = typeof urls.$inferSelect;
export type NewUrl = typeof urls.$inferInsert;

export type ClickDaily = typeof clickDaily.$inferSelect;

/**
 * Simulated payment — no gateway involved. Rows are written by the billing
 * module when a checkout is confirmed; `reference` is the receipt number
 * shown to the user.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: userPlanEnum("plan").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    reference: text("reference").notNull(),
    status: paymentStatusEnum("status").notNull().default("succeeded"),
    /** When the purchased plan period ends (set on the user at checkout). */
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("payments_reference_unique").on(table.reference),
    index("payments_user_id_idx").on(table.userId),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
