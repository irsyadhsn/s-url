/**
 * Seeds an admin user (creates it, or promotes it if the email exists).
 *
 * Usage: npm run db:seed:admin -- [email] [password]
 * Defaults (dev only): admin@surlvibe.local / Admin123!
 */
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { users } from "../src/db/schema.js";

const BCRYPT_ROUNDS = 12;
const DEFAULT_EMAIL = "admin@surlvibe.local";
const DEFAULT_PASSWORD = "Admin123!";

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2);
  const email = (emailArg ?? DEFAULT_EMAIL).toLowerCase();
  const password = passwordArg ?? DEFAULT_PASSWORD;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) {
    if (existing[0].role === "admin") {
      console.log(`Already an admin: ${email}`);
      return;
    }
    const [updated] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, existing[0].id))
      .returning({ email: users.email, role: users.role });
    console.log(`Promoted existing user → admin: ${updated!.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, role: "admin" })
    .returning({ email: users.email, role: users.role });
  console.log(`Created admin user: ${created!.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
