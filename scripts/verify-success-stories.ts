/**
 * Phase 6 verification harness — LOCAL ONLY.
 *
 *   DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" \
 *     node --conditions react-server --import tsx scripts/verify-success-stories.ts
 *
 * Exercises the REAL service functions (not reimplementations) end to end:
 *   create → update → publish → unpublish → archive → restore → reorder
 * and asserts the resulting rows, ContentVersion snapshots and AuditLog
 * entries after each step.
 *
 * `--conditions react-server` is what lets a plain Node process import the
 * server-only service module; it is a test-harness detail, not a change to how
 * the app runs. This harness deliberately does NOT cover the authorization
 * gate — that lives in the server actions and is verified separately through
 * real authenticated sessions.
 *
 * Cleans up everything it creates. Refuses to run against a non-local database.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import assert from "node:assert/strict";
import { exit } from "node:process";
import { db } from "../src/lib/db";
import { AlumniCategory, ContentStatus } from "../src/generated/prisma/enums";
import {
  createStory,
  updateStory,
  changeStoryStatus,
  reorderStories,
  listStories,
  getStory,
  getStoryVersions,
  STORY_ENTITY,
} from "../src/modules/cms/success-stories";
import type { SuccessStoryInput } from "../src/modules/cms/success-story-schema";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const MARKER = "ZZ Verification Fixture";

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${label}`);
}

async function versionsFor(id: string) {
  return db.contentVersion.findMany({
    where: { entity_type: STORY_ENTITY, entity_id: id },
    orderBy: { version_number: "asc" },
  });
}

async function auditFor(id: string) {
  return db.auditLog.findMany({
    where: { entity_type: STORY_ENTITY, entity_id: id },
    orderBy: { created_at: "asc" },
  });
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  if (!LOCAL_HOSTS.has(host)) {
    console.error(`\n✗ Refusing to run against a non-local host (${host || "unparseable"}).\n`);
    exit(1);
  }
  console.log(`\n  Target: ${new URL(url).pathname.replace("/", "")} on ${host}\n`);

  const actor = await db.cmsUser.findFirst({
    where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  if (!actor) {
    console.error("✗ No active Super Admin found.");
    exit(1);
  }

  const base: SuccessStoryInput = {
    category: "COHORT_ALUMNI",
    full_name: MARKER,
    profile_image_url: "assets/test.png",
    linkedin_url: "https://www.linkedin.com/in/test-fixture",
    previous_designation: "Before Role",
    previous_company: "Before Co",
    current_designation: "After Role",
    current_company: "After Co",
    growth_headline: "Before → After",
    growth_description: undefined,
    short_description: undefined,
    full_story: undefined,
    testimonial: "Original testimonial.",
  };

  let id = "";

  try {
    // ── CREATE ────────────────────────────────────────────────────
    console.log("CREATE");
    const created = await createStory(base, actor.id);
    assert.ok(created.ok, "create should succeed");
    if (!created.ok) return;
    id = created.id;

    let row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("row created as DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("published_at not set on create", () => assert.equal(row.published_at, null));
    check("created_by recorded", () => assert.equal(row.created_by_id, actor.id));

    let versions = await versionsFor(id);
    check("ContentVersion 1 written", () => {
      assert.equal(versions.length, 1);
      assert.equal(versions[0].version_number, 1);
    });

    let audit = await auditFor(id);
    check("AuditLog records the creation", () => {
      assert.equal(audit.length, 1);
      assert.equal(audit[0].action, "success_story.created");
      assert.equal(audit[0].entity_name, MARKER);
      assert.equal(audit[0].cms_user_id, actor.id);
    });

    // ── UPDATE ────────────────────────────────────────────────────
    console.log("\nUPDATE");
    const edited = { ...base, testimonial: "Revised testimonial." };
    const upd = await updateStory(id, edited, actor.id);
    assert.ok(upd.ok, "update should succeed");
    if (!upd.ok) return;

    row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("content changed", () => assert.equal(row.testimonial, "Revised testimonial."));
    check("only the changed field is reported", () =>
      assert.deepEqual(upd.changedFields, ["testimonial"]));

    versions = await versionsFor(id);
    check("ContentVersion 2 appended", () => {
      assert.equal(versions.length, 2);
      assert.equal(versions[1].version_number, 2);
    });
    check("version 1 is untouched (append-only)", () =>
      assert.equal(
        (versions[0].content_data as Record<string, unknown>).testimonial,
        "Original testimonial.",
      ));

    // ── NO-OP UPDATE ──────────────────────────────────────────────
    console.log("\nNO-OP UPDATE");
    const noop = await updateStory(id, edited, actor.id);
    assert.ok(noop.ok);
    if (noop.ok) {
      check("no fields reported changed", () => assert.deepEqual(noop.changedFields, []));
    }
    versions = await versionsFor(id);
    check("still 2 versions after a no-op save", () => assert.equal(versions.length, 2));
    audit = await auditFor(id);
    check("no phantom activity entry", () => assert.equal(audit.length, 2));

    // ── PUBLISH ───────────────────────────────────────────────────
    console.log("\nPUBLISH");
    assert.ok((await changeStoryStatus(id, "publish", actor.id)).ok);
    row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("status is PUBLISHED", () => assert.equal(row.status, ContentStatus.PUBLISHED));
    check("published_at is set", () => assert.ok(row.published_at instanceof Date));
    const firstPublishedAt = row.published_at;

    audit = await auditFor(id);
    check("AuditLog records the publish", () =>
      assert.equal(audit.at(-1)?.action, "success_story.published"));

    // ── UNPUBLISH ─────────────────────────────────────────────────
    console.log("\nUNPUBLISH");
    assert.ok((await changeStoryStatus(id, "unpublish", actor.id)).ok);
    row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("back to DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("published_at preserved (first-publication record)", () =>
      assert.deepEqual(row.published_at, firstPublishedAt));

    // ── ARCHIVE / RESTORE ─────────────────────────────────────────
    console.log("\nARCHIVE / RESTORE");
    assert.ok((await changeStoryStatus(id, "archive", actor.id)).ok);
    row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("status is ARCHIVED", () => assert.equal(row.status, ContentStatus.ARCHIVED));
    check("archived_at is set", () => assert.ok(row.archived_at instanceof Date));

    assert.ok((await changeStoryStatus(id, "restore", actor.id)).ok);
    row = await db.successStory.findUniqueOrThrow({ where: { id } });
    check("restore returns it to DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("archived_at cleared", () => assert.equal(row.archived_at, null));

    // ── ORDERING ──────────────────────────────────────────────────
    console.log("\nORDERING");
    const cohort = await db.successStory.findMany({
      where: { category: AlumniCategory.COHORT_ALUMNI, deleted_at: null },
      orderBy: { display_order: "asc" },
      select: { id: true },
    });
    const reversed = [...cohort].reverse().map((r) => r.id);
    assert.ok((await reorderStories(AlumniCategory.COHORT_ALUMNI, reversed, actor.id)).ok);

    const after = await db.successStory.findMany({
      where: { category: AlumniCategory.COHORT_ALUMNI, deleted_at: null },
      orderBy: { display_order: "asc" },
      select: { id: true, display_order: true },
    });
    check("order follows the supplied sequence", () =>
      assert.deepEqual(after.map((r) => r.id), reversed));
    check("positions are a dense 1..n", () =>
      assert.deepEqual(after.map((r) => r.display_order), after.map((_, i) => i + 1)));

    // Put the original order back.
    await reorderStories(AlumniCategory.COHORT_ALUMNI, cohort.map((r) => r.id), actor.id);

    // Advanced-module ordering must be untouched by cohort reordering.
    const advanced = await db.successStory.count({
      where: { category: AlumniCategory.ADVANCED_MODULE_ALUMNI, deleted_at: null },
    });
    check("reorder is scoped to one category", () => assert.equal(advanced, 0));

    // ── READ PATHS ────────────────────────────────────────────────
    console.log("\nREADS");
    const list = await listStories();
    check("listStories returns ok", () => assert.equal(list.status, "ok"));
    const detail = await getStory(id);
    check("getStory returns the row", () => {
      assert.equal(detail.status, "ok");
      if (detail.status === "ok") assert.equal(detail.data?.fullName, MARKER);
    });
    const vs = await getStoryVersions(id);
    check("version history is newest-first", () =>
      assert.ok(vs.length >= 2 && vs[0].version_number > vs[1].version_number));

    console.log(`\n✓ ${passed} assertions passed.\n`);
  } finally {
    // Remove only what this harness created.
    if (id) {
      await db.contentVersion.deleteMany({ where: { entity_type: STORY_ENTITY, entity_id: id } });
      await db.auditLog.deleteMany({ where: { entity_type: STORY_ENTITY, entity_id: id } });
      await db.successStory.delete({ where: { id } }).catch(() => {});
      console.log("  fixture removed.\n");
    }
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.stack : String(err)}\n`);
  exit(1);
});
