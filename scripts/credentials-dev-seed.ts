/**
 * LOCAL DEVELOPMENT ONLY — seeds staff identities, program codes and an active
 * development template so the credential system can be exercised end to end.
 * Refuses to run against anything but a localhost database.
 *
 *   npx tsx --conditions=react-server scripts/credentials-dev-seed.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error("Refusing to seed a non-local database.");
  const { db } = await import("../src/lib/db");
  const { createDevTemplate, activateTemplate } = await import("../src/modules/credentials/templates");
  const { LocalStorage } = await import("../src/modules/credentials/storage");
  const { sendEmail } = await import("../src/lib/email");

  const people = [
    { email: "admin@dev.local", name: "Asha Admin", role: "ADMIN" },
    { email: "issuer@dev.local", name: "Ishaan Issuer", role: "ISSUER" },
    { email: "accounts@dev.local", name: "Anita Accounts", role: "ACCOUNTS" },
    { email: "viewer@dev.local", name: "Vikram Viewer", role: "VIEWER" },
  ] as const;
  const staff = [];
  for (const p of people) {
    staff.push(await db.staffUser.upsert({ where: { email: p.email }, create: { ...p, clerk_user_id: `dev:${p.email}` }, update: { role: p.role, is_active: true } }));
  }
  const admin = staff[0];
  const deps = { db, storage: new LocalStorage(), mailer: sendEmail, now: () => new Date() };
  const codes: Record<string, string> = { "foundation-program": "FND", "advanced-module": "ADV" };
  for (const [slug, code] of Object.entries(codes)) {
    const course = await db.course.findUnique({ where: { slug } });
    if (!course) continue;
    await db.course.update({ where: { id: course.id }, data: { code } });
    const active = await db.certificateTemplate.findFirst({ where: { course_id: course.id, status: "ACTIVE" } });
    if (!active) await activateTemplate((await createDevTemplate(course.id, admin, deps)).id, admin, deps);
    console.log(`${course.name}: code ${code}, dev template active`);
  }
  console.log("Staff:", staff.map((s) => `${s.name} (${s.role})`).join(", "));
  await db.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
