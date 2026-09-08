/**
 * Import the faculty currently hardcoded on the public homepage into the CMS,
 * for LOCAL verification only.
 *
 *   DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" \
 *     npx tsx scripts/seed-faculty.ts
 *
 * Content extracted verbatim from the #faculty section of index.html, with
 * HTML entities decoded. A fixture for testing the CMS round trip, NOT a second
 * source of truth: the public site still renders its own markup until Phase 8.
 *
 * Idempotent: matches on full_name, updates rather than duplicating.
 * Refuses to run against a non-local database.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import { exit } from "node:process";
import { PrismaClient } from "../src/generated/prisma/client";
import { ContentStatus } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/**
 * Every badge on the live card is kept as an expertise capsule, verbatim.
 *
 * That includes the ones that read like experience ("20+ Years Experience"):
 * splitting those into years_experience / experience_display would change what
 * the card shows. They stay as tags so the seeded data matches the live design
 * exactly; an editor can restructure them later in the CMS if they want to.
 *
 * organization, years_experience, experience_display and short_bio are left
 * empty because the live markup has no equivalent — inventing values would be
 * fabricating content.
 */
const FACULTY = [
  {
    full_name: "Gagan Victor",
    designation: "Co-Founder and Program Director",
    profile_image_url: "assets/gagan_victor.jpg",
    expertise: [
      "Former Pfizer, BMS, Medtronic & Stryker",
      "Career Coach",
      "Podcaster",
    ],
    full_bio:
      "Former leader at Pfizer, BMS, Medtronic India and Stryker, overseeing Cardiovascular and Surgical device portfolio. Transitioned from Medical Rep to Corporate MedTech Leader to full time training, coaching, mentoring to build India’s next generation of MedTech ready professionals.",
  },
  {
    full_name: "Shilpi Babbar",
    designation: "Co-founder and Skills Enhancement Coach",
    profile_image_url: "assets/shilpi_babbar.jpg",
    expertise: ["ICBI-NABET Certified", "Skills Enhancement Coach", "11+ Years Experience"],
    full_bio:
      "Co-founder and Skills Enhancement Coach at MedSkills Catalyst, with experience of more than a decade in coaching and career counselling certified by ICBI-NABET. Shilpi specialises in stress management, emotional intelligence, and helping candidates bridge the transition gap by mastering the vital interpersonal skills, communication strategies, and mental resilience required to thrive in high-pressure MedTech corporate environments.",
  },
  {
    full_name: "Dr. Vincent Keny, PhD",
    designation: "AI Transformational Leader, Executive Coach & Leadership Mentor",
    profile_image_url: "assets/vincent_keny.png",
    expertise: ["Ex-Boston Scientific", "ICF Certified Coach", "MIT Sloan Alumnus"],
    full_bio:
      "With over 25 years of global corporate leadership experience, Dr. Keny brings executive-grade coaching to MedSkills. An ICF Certified Coach and MIT Sloan alumnus, he works with candidates on behavioral orientation, executive communication, and the interpersonal dynamics that determine performance in high-stakes MedTech corporate environments.",
  },
  {
    full_name: "Tabish",
    designation: "L&D Specialist & Corporate Mentor",
    profile_image_url: "assets/tabish.jpg",
    expertise: ["Ex-3M, BD & Abbott Vascular", "L&D Specialist", "20+ Years Experience"],
    full_bio:
      "With 20+ years of experience in healthcare and MedTech, including roles at 3M, Becton Dickinson, and Abbott Vascular, and learning partnerships with global brands such as Cipla, Amazon, and PwC, Tabish combines deep industry expertise with her L&D qualifications to design learning programs that help learners build the behavioural competencies essential for successful MedTech careers.",
  },
];

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DIRECT_URL (or DATABASE_URL) is not set.");
    exit(1);
  }

  let host = "";
  let database = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, "");
  } catch {
    console.error("✗ Could not parse the database URL.");
    exit(1);
  }

  console.log(`\n  Target database: ${database} on ${host}`);

  if (!LOCAL_HOSTS.has(host) && process.env.CMS_ALLOW_REMOTE !== "1") {
    console.error(
      "\n✗ Refusing to run: that is not a local database." +
        "\n  This script loads .env.local, which points at production." +
        "\n  Prefix the command with a local connection, e.g." +
        '\n    DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev"\n',
    );
    exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const actor = await db.cmsUser.findFirst({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
      select: { id: true, email: true },
    });
    if (!actor) {
      console.error("\n✗ No active Super Admin found. Create one first.");
      exit(1);
    }
    console.log(`  Attributing to: ${actor.email}\n`);

    let created = 0;
    let updated = 0;

    for (const [index, member] of FACULTY.entries()) {
      const { expertise, ...fields } = member;
      const existing = await db.faculty.findFirst({
        where: { full_name: member.full_name, deleted_at: null },
        select: { id: true },
      });

      const data = { ...fields, display_order: index + 1, updated_by_id: actor.id };

      // One transaction per member so a member and their tags land together.
      await db.$transaction(async (tx) => {
        const id = existing
          ? (await tx.faculty.update({ where: { id: existing.id }, data, select: { id: true } })).id
          : (
              await tx.faculty.create({
                data: { ...data, status: ContentStatus.DRAFT, created_by_id: actor.id },
                select: { id: true },
              })
            ).id;

        await tx.facultyExpertise.deleteMany({ where: { faculty_id: id } });
        await tx.facultyExpertise.createMany({
          data: expertise.map((expertise_name, i) => ({
            faculty_id: id,
            expertise_name,
            display_order: i + 1,
          })),
        });
      });

      if (existing) {
        updated++;
        console.log(`  ~ updated  ${member.full_name} (${expertise.length} tags)`);
      } else {
        created++;
        console.log(`  + created  ${member.full_name} (${expertise.length} tags)`);
      }
    }

    console.log(`\n✓ ${created} created, ${updated} updated.`);
    console.log("  All imported as DRAFT.");
    console.log("  Publish them from /cms/faculty when you are ready.\n");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : "Unexpected error."}`);
  exit(1);
});
