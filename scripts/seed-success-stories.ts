/**
 * Import the success stories currently hardcoded on the public homepage into
 * the CMS, for LOCAL verification only.
 *
 *   DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" \
 *     npx tsx scripts/seed-success-stories.ts
 *
 * The content below was extracted verbatim from index.html — the six cards in
 * #success-stories. It is a fixture for testing the CMS round trip, NOT a
 * second source of truth: the public site still renders its own markup until
 * Phase 8 wires it up.
 *
 * Idempotent: matches on full_name, updates rather than duplicating.
 *
 * Refuses to run against a non-local database, for the same reason
 * create-cms-admin.ts does — .env.local points at production.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import { exit } from "node:process";
import { PrismaClient } from "../src/generated/prisma/client";
import { AlumniCategory, ContentStatus } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/**
 * All six are seeded as COHORT_ALUMNI.
 *
 * The homepage splits them across two marquee rows (track-1 / track-2), but
 * those rows are a visual device and carry no category meaning — established
 * in the Phase 0 audit. Re-categorising any of them is a one-line change here
 * followed by a re-run.
 */
const STORIES = [
  {
    full_name: "Anand Gupta",
    profile_image_url: "assets/anand_gupta.png",
    linkedin_url: "https://www.linkedin.com/in/anand-gupta-79326a66",
    growth_headline: "MedTech Marketing → Founder",
    previous_designation: "Marketing Manager",
    previous_company: "Medtronic India",
    current_designation: "Founder",
    current_company: "Sarathi Consulting Solutions",
    testimonial:
      "\"After 18 years at Medtronic, I had deep product knowledge but needed to think like a business owner, not a marketing manager. MedSkills Catalyst helped me make that shift. The programme gave me frameworks for commercial strategy and market positioning that I use every day running my consulting practice. For anyone in MedTech thinking about entrepreneurship, it sharpens your thinking in ways corporate training rarely does.\"",
  },
  {
    full_name: "Vasudha Singh",
    profile_image_url: "assets/vasudha_singh.png",
    linkedin_url: "https://www.linkedin.com/in/vasudha-singh2503",
    growth_headline: "Biotech → MedTech",
    previous_designation: "Senior Territory Manager",
    previous_company: null,
    current_designation: "Zonal Account Manager",
    current_company: null,
    testimonial:
      "\"I was a sales representative when I joined, and my goal was to grow into a more senior commercial role. The founders of MedSkills Catalyst helped me understand account strategy, not just account management. The Stratafix portfolio at Johnson & Johnson demands a different kind of thinking from field sales, and their mentorship prepared me for that. If you're in pharma or an entry-level MedTech field role and want to move up, this is where you start.\"",
  },
  {
    full_name: "Shivam Tiwari",
    profile_image_url: "assets/shivam_tiwari.png",
    linkedin_url: "https://www.linkedin.com/in/shivam-tiwari-41a4331a0",
    growth_headline: "Clinical Support → Territory Management",
    previous_designation: "Product Specialist / Field Clinical Specialist",
    previous_company: null,
    current_designation: "Territory Manager",
    current_company: null,
    testimonial:
      "\"Coming from a clinical background, the commercial side of MedTech felt like a different language. The founders of MedSkills Catalyst taught me how to think like a Territory Manager. The training on cardiovascular devices and commercial strategy directly prepared me for my current role at Abbott. I would not have made this transition as quickly on my own without the guidance and mentorship from the MedSkills Catalyst founders.\"",
  },
  {
    full_name: "Garvita Khurana",
    profile_image_url: "assets/garvita_khurana.png",
    linkedin_url: "https://www.linkedin.com/in/garvita-khurana-33b60434",
    growth_headline: "Sales → Product Management",
    previous_designation: "Senior Territory Sales Manager",
    previous_company: null,
    current_designation: "Product Manager",
    current_company: null,
    testimonial:
      "\"I spent years in sales and assumed product management was an entirely different world. The founders of MedSkills Catalyst helped me see the connection. Their mentorship gave me a structured way to think about product development, clinical workflows, and what it actually takes to bring a device to market. That grounding is why I was able to make the switch to a Product Manager role at Teleflex.\"",
  },
  {
    full_name: "Sandeep Kumar",
    profile_image_url: "assets/sandeep_kumar.png",
    linkedin_url: "https://www.linkedin.com/in/sandeep-kumar-3378911a",
    growth_headline: "Key Accounts → Regional Sales",
    previous_designation: "Senior Key Account Manager",
    previous_company: "Ortho Clinical Diagnostics",
    current_designation: "Regional Sales Manager",
    current_company: "Diasorin",
    testimonial:
      "\"Moving from key account management to a regional sales role is a real step up, and I needed to think differently about team leadership and commercial planning. MedSkills Catalyst gave me that. The programme is not just about selling — it builds how you think about markets and growth. That preparation made a difference when I stepped into the RSM role at Diasorin.\"",
  },
  {
    full_name: "Pramit Shrestha",
    profile_image_url: "assets/pramit_shrestha.png",
    linkedin_url: "https://www.linkedin.com/in/pramit-shrestha/",
    growth_headline: "Territory Management → Sales Leadership",
    previous_designation: "Territory Manager",
    previous_company: "Werfen",
    current_designation: "Sales Team Leader",
    current_company: "Werfen",
    testimonial:
      "\"I'd spent years building my career in field sales, so I assumed the next step would come naturally. But moving into leadership was a completely different challenge. It wasn't just about selling anymore—it was about leading people, thinking strategically, and understanding the bigger picture. MedSkills Catalyst helped me build that commercial mindset and gave me the confidence to take on the role. Looking back, the move from Territory Manager to Sales Team Leader at Werfen felt like a well-prepared step rather than a jump into the unknown.\"",
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
    // Attribute the import to a Super Admin so audit rows have a real actor.
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

    for (const [index, story] of STORIES.entries()) {
      const existing = await db.successStory.findFirst({
        where: { full_name: story.full_name, deleted_at: null },
        select: { id: true },
      });

      const data = {
        ...story,
        category: AlumniCategory.COHORT_ALUMNI,
        display_order: index + 1,
        updated_by_id: actor.id,
      };

      if (existing) {
        await db.successStory.update({ where: { id: existing.id }, data });
        updated++;
        console.log(`  ~ updated  ${story.full_name}`);
      } else {
        await db.successStory.create({
          data: { ...data, status: ContentStatus.DRAFT, created_by_id: actor.id },
        });
        created++;
        console.log(`  + created  ${story.full_name}`);
      }
    }

    console.log(`\n✓ ${created} created, ${updated} updated.`);
    console.log("  All imported as DRAFT under Cohort Alumni.");
    console.log("  Publish them from /cms/success-stories when you are ready.\n");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : "Unexpected error."}`);
  exit(1);
});
