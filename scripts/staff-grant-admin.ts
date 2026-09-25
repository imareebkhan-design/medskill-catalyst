/**
 * Break-glass: provision (or restore) an ADMIN staff row by email.
 *
 *   npx tsx scripts/staff-grant-admin.ts someone@medskillscatalyst.com "Full Name"
 *
 * - No row for the email      → creates a pending ADMIN row; it binds to the
 *                               person's Clerk account on their first sign-in
 *                               with that VERIFIED email.
 * - Row exists                → sets role=ADMIN and is_active=true.
 *
 * Requires DIRECT_URL/DATABASE_URL for the target environment in .env.local.
 * Every run is written to audit_logs.
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const [emailArg, ...nameParts] = process.argv.slice(2);
  const email = (emailArg ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("Usage: npx tsx scripts/staff-grant-admin.ts <email> [full name]");
    process.exit(1);
  }
  const { db } = await import("../src/lib/db");
  const existing = await db.staffUser.findUnique({ where: { email } });
  const staff = existing
    ? await db.staffUser.update({ where: { email }, data: { role: "ADMIN", is_active: true } })
    : await db.staffUser.create({
        data: { email, name: nameParts.join(" ") || email, role: "ADMIN", clerk_user_id: `pending:${email}` },
      });
  await db.auditLog.create({
    data: {
      action: "STAFF_BREAK_GLASS_ADMIN",
      entity_type: "staff_user",
      entity_id: staff.id,
      before: existing ? { role: existing.role, is_active: existing.is_active } : undefined,
      after: { role: "ADMIN", is_active: true, email },
    },
  });
  console.log(`${existing ? "Restored" : "Provisioned"} ADMIN: ${email} (${staff.clerk_user_id.startsWith("pending:") ? "pending first sign-in" : "bound"})`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
