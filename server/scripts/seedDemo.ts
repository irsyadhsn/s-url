/**
 * Seeds four demo accounts + a pile of links so the dashboard, the
 * custom-alias quota, and the plan gates are all testable immediately.
 *
 *   free5@test.dev    free plan, already holding 5 custom aliases (at the limit)
 *   freenew@test.dev  free plan, no custom aliases yet
 *   premium@test.dev  premium for 30 days, several custom aliases
 *   expiring@test.dev premium with only ~2 days left (renews/expiry UI)
 *
 * All passwords are "Password123!" — dev only. Idempotent: existing
 * emails are reused, existing short codes are skipped.
 *
 * Usage: npm run db:seed:demo
 * Then:  npm run db:seed:clicks   (fills the chart with click history)
 */
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { urls, users } from "../src/db/schema.js";

const PASSWORD = "Password123!";
const BCRYPT_ROUNDS = 12;
const PREMIUM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface DemoUser {
  email: string;
  plan: "free" | "premium";
  /** Overrides the default 30-day period (kept fresh on every reseed). */
  expiresInDays?: number;
  links: { code: string; url: string; custom?: boolean }[];
}

const FREE_AT_LIMIT = [
  "launch-week",
  "pricing-doc",
  "team-wiki",
  "status-page",
  "changelog",
];

const FREE_EMPTY: string[] = [];

const PREMIUM_LINKS = [
  { code: "brand-home", url: "https://example.com" },
  { code: "brand-blog", url: "https://example.com/blog" },
  { code: "brand-docs", url: "https://example.com/docs" },
  { code: "brand-support", url: "https://example.com/support" },
];

/** Plain generated-code links so the list + chart look busy. */
const PLAIN_LINKS = [
  "https://www.wikipedia.org/wiki/URL_shortening",
  "https://developer.mozilla.org/en-US/docs/Web/HTTP",
  "https://nodejs.org/en/docs",
  "https://react.dev/learn",
  "https://www.postgresql.org/docs/current/index.html",
  "https://redis.io/docs/latest/",
  "https://expressjs.com/",
  "https://zod.dev/",
  "https://vitejs.dev/guide/",
  "https://tailwindcss.com/docs",
];

const DEMO_USERS: DemoUser[] = [
  {
    email: "free5@test.dev",
    plan: "free",
    links: FREE_AT_LIMIT.map((code, i) => ({
      code,
      url: `https://example.com/free-at-limit/${i + 1}`,
      custom: true,
    })),
  },
  {
    email: "freenew@test.dev",
    plan: "free",
    links: FREE_EMPTY.map((code) => ({ code, url: "", custom: true })),
  },
  {
    email: "premium@test.dev",
    plan: "premium",
    links: PREMIUM_LINKS.map(({ code, url }) => ({
      code,
      url,
      custom: true,
    })),
  },
  {
    // Nearly-expired premium: exercises the "days left" + renew UI.
    email: "expiring@test.dev",
    plan: "premium",
    expiresInDays: 2,
    links: [
      { code: "launch-kit", url: "https://example.com/launch-kit" },
      { code: "brand-shop", url: "https://example.com/shop" },
    ],
  },
];

async function upsertUser(
  email: string,
  plan: "free" | "premium",
  expiresInDays?: number,
) {
  const periodDays = expiresInDays ?? PREMIUM_DAYS;
  const desiredExpiry =
    plan === "premium" ? new Date(Date.now() + periodDays * DAY_MS) : null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) {
    const row = existing[0];
    // Refresh the period on every reseed so "2 days left" stays true.
    const expiryStale =
      plan === "premium" &&
      (!row.planExpiresAt ||
        Math.abs(row.planExpiresAt.getTime() - desiredExpiry!.getTime()) >
          DAY_MS);
    if (row.plan !== plan || expiryStale) {
      await db
        .update(users)
        .set({ plan, planExpiresAt: desiredExpiry })
        .where(eq(users.id, row.id));
    }
    return row;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, plan, planExpiresAt: desiredExpiry })
    .returning();
  return created!;
}

function randomCode(): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function seedLinks(
  userId: string,
  links: DemoUser["links"],
): Promise<number> {
  let created = 0;

  for (const link of links) {
    const clash = await db
      .select({ id: urls.id })
      .from(urls)
      .where(eq(urls.shortCode, link.code))
      .limit(1);
    if (clash[0]) continue;

    await db.insert(urls).values({
      shortCode: link.code,
      originalUrl: link.url,
      userId,
      isCustomAlias: link.custom ?? false,
    });
    created++;
  }

  return created;
}

async function seedPlainLinks(userId: string, howMany: number) {
  // Idempotent: only top up accounts that have no generated-code links yet
  // (custom aliases don't count — premium users have those by design).
  const owned = await db
    .select({ id: urls.id })
    .from(urls)
    .where(and(eq(urls.userId, userId), eq(urls.isCustomAlias, false)));
  if (owned.length > 0) return 0;

  let created = 0;
  for (let i = 0; i < howMany; i++) {
    const code = randomCode();
    const clash = await db
      .select({ id: urls.id })
      .from(urls)
      .where(eq(urls.shortCode, code))
      .limit(1);
    if (clash[0]) continue;

    await db.insert(urls).values({
      shortCode: code,
      originalUrl: PLAIN_LINKS[i % PLAIN_LINKS.length]!,
      userId,
    });
    created++;
  }
  return created;
}

async function main() {
  for (const demo of DEMO_USERS) {
    const user = await upsertUser(demo.email, demo.plan, demo.expiresInDays);
    const aliasCount = await seedLinks(user.id, demo.links);
    const plainCount = await seedPlainLinks(
      user.id,
      demo.plan === "premium" ? 8 : 4,
    );

    const expiryNote =
      demo.expiresInDays !== undefined
        ? ` · expires in ~${demo.expiresInDays}d`
        : "";
    console.log(
      `${demo.email} [${demo.plan}${expiryNote}] — ${aliasCount} aliases, ${plainCount} plain links created`,
    );
  }

  console.log("\nPasswords: Password123!");
  console.log("Next: npm run db:seed:clicks   (chart history)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
