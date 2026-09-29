/**
 * Promotes (or demotes) a user's role from the command line — the only way
 * to create the very first admin, since registration always yields "user".
 *
 * Usage: npm run admin:promote -- user@example.com [admin|user]
 */
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { users, type UserRole } from "../src/db/schema.js";

async function main() {
  const [email, roleArg] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: npm run admin:promote -- <email> [admin|user]");
    process.exitCode = 1;
    return;
  }

  const role: UserRole = (roleArg as UserRole | undefined) ?? "admin";
  if (role !== "admin" && role !== "user") {
    console.error(`Invalid role "${roleArg}" — expected "admin" or "user"`);
    process.exitCode = 1;
    return;
  }

  const rows = await db
    .update(users)
    .set({ role })
    .where(eq(users.email, email.toLowerCase()))
    .returning({ id: users.id, email: users.email, role: users.role });

  const user = rows[0];
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Set ${user.email} → ${user.role}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
