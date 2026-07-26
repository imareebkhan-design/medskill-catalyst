/**
 * Seeds the first ADMIN staff user from the first Clerk user account.
 * Run after signing up in Clerk:  npx tsx prisma/seed.ts
 * Idempotent: re-running promotes/repairs, never duplicates.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
  const db = new PrismaClient({ adapter });

  const { data: users } = await clerk.users.getUserList({ orderBy: "+created_at", limit: 5 });
  if (users.length === 0) {
    console.log("No Clerk users yet. Sign up at /sign-up first, then re-run.");
    return;
  }

  const first = users[0];
  const email = first.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("First Clerk user has no email");
  const name =
    [first.firstName, first.lastName].filter(Boolean).join(" ") || email;

  const admin = await db.staffUser.upsert({
    where: { clerk_user_id: first.id },
    create: { clerk_user_id: first.id, email, name, role: "ADMIN", is_active: true },
    update: { role: "ADMIN", is_active: true, email, name },
  });
  console.log(`ADMIN seeded: ${admin.email} (${admin.id})`);

  if (users.length > 1) {
    console.log(
      "Other Clerk users found (not touched):",
      users.slice(1).map((u) => u.emailAddresses[0]?.emailAddress).join(", "),
    );
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
