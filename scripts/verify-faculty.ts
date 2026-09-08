/**
 * Phase 7 verification harness — LOCAL ONLY.
 *
 *   DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" \
 *   DATABASE_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" \
 *     node --conditions react-server --import tsx scripts/verify-faculty.ts
 *
 * Exercises the REAL service functions end to end:
 *   create → update → expertise replacement → publish → unpublish →
 *   archive → restore → reorder
 * asserting rows, faculty_expertise, ContentVersion and AuditLog at each step.
 *
 * `--conditions react-server` lets plain Node import the server-only service
 * module; a harness detail, not a change to how the app runs. This does NOT
 * cover the authorization gate — that lives in the server actions and is
 * verified through real authenticated sessions.
 *
 * Cleans up everything it creates. Refuses non-local databases.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import assert from "node:assert/strict";
import { exit } from "node:process";
import { db } from "../src/lib/db";
import { ContentStatus } from "../src/generated/prisma/enums";
import {
  createFaculty,
  updateFaculty,
  changeFacultyStatus,
  reorderFaculty,
  listFaculty,
  getFaculty,
  getFacultyVersions,
  FACULTY_ENTITY,
} from "../src/modules/cms/faculty";
import type { FacultyInput } from "../src/modules/cms/faculty-schema";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const MARKER = "ZZ Faculty Fixture";

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${label}`);
}

const versionsFor = (id: string) =>
  db.contentVersion.findMany({
    where: { entity_type: FACULTY_ENTITY, entity_id: id },
    orderBy: { version_number: "asc" },
  });

const auditFor = (id: string) =>
  db.auditLog.findMany({
    where: { entity_type: FACULTY_ENTITY, entity_id: id },
    orderBy: { created_at: "asc" },
  });

const tagsFor = (id: string) =>
  db.facultyExpertise.findMany({
    where: { faculty_id: id },
    orderBy: { display_order: "asc" },
  });

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

  const base: FacultyInput = {
    full_name: MARKER,
    designation: "Test Designation",
    organization: "Test Org",
    profile_image_url: "assets/test.jpg",
    years_experience: 12,
    experience_display: "12+ Years Experience",
    short_bio: "Short bio.",
    full_bio: "Full biography.",
    expertise: ["Alpha", "Beta", "Gamma"],
  };

  let id = "";
  // Kept after `id` is cleared by the cascade test, so cleanup stays scoped to
  // this fixture and never touches seeded faculty.
  let fixtureId = "";

  try {
    // ── CREATE ────────────────────────────────────────────────────
    console.log("CREATE");
    const created = await createFaculty(base, actor.id);
    assert.ok(created.ok, "create should succeed");
    if (!created.ok) return;
    id = created.id;
    fixtureId = created.id;

    let row = await db.faculty.findUniqueOrThrow({ where: { id } });
    check("row created as DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("published_at not set on create", () => assert.equal(row.published_at, null));
    check("years_experience stored as a number", () =>
      assert.equal(row.years_experience, 12));

    let tags = await tagsFor(id);
    check("all three expertise tags written", () => assert.equal(tags.length, 3));
    check("expertise order is dense 1..n and matches input", () =>
      assert.deepEqual(
        tags.map((t) => [t.display_order, t.expertise_name]),
        [
          [1, "Alpha"],
          [2, "Beta"],
          [3, "Gamma"],
        ],
      ));

    let versions = await versionsFor(id);
    check("ContentVersion 1 present", () => {
      assert.equal(versions.length, 1);
      assert.equal(versions[0].version_number, 1);
    });

    let audit = await auditFor(id);
    check("AuditLog records the creation", () => {
      assert.equal(audit.length, 1);
      assert.equal(audit[0].action, "faculty.created");
      assert.equal(audit[0].entity_name, MARKER);
      assert.equal(audit[0].cms_user_id, actor.id);
    });

    // ── UPDATE (content only) ─────────────────────────────────────
    console.log("\nUPDATE — content");
    const edited = { ...base, full_bio: "Revised biography." };
    const upd = await updateFaculty(id, edited, actor.id);
    assert.ok(upd.ok);
    if (!upd.ok) return;
    check("only full_bio reported changed", () =>
      assert.deepEqual(upd.changedFields, ["full_bio"]));

    tags = await tagsFor(id);
    const tagIds = tags.map((t) => t.id);
    check("expertise rows untouched when tags did not change", () =>
      assert.equal(tags.length, 3));

    versions = await versionsFor(id);
    check("ContentVersion 2 appended", () => assert.equal(versions.length, 2));
    check("version 1 preserved (append-only)", () =>
      assert.equal(
        (versions[0].content_data as Record<string, unknown>).full_bio,
        "Full biography.",
      ));

    // ── UPDATE (expertise) ────────────────────────────────────────
    console.log("\nUPDATE — expertise");
    const retagged = { ...edited, expertise: ["Gamma", "Delta"] };
    const upd2 = await updateFaculty(id, retagged, actor.id);
    assert.ok(upd2.ok);
    if (!upd2.ok) return;
    check("expertise reported as changed", () =>
      assert.ok(upd2.changedFields.includes("expertise")));

    tags = await tagsFor(id);
    check("tags replaced wholesale, reordered and renumbered", () =>
      assert.deepEqual(
        tags.map((t) => [t.display_order, t.expertise_name]),
        [
          [1, "Gamma"],
          [2, "Delta"],
        ],
      ));
    check("old tag rows are gone, not orphaned", () =>
      assert.ok(tags.every((t) => !tagIds.includes(t.id))));

    // ── NO-OP UPDATE ──────────────────────────────────────────────
    console.log("\nNO-OP UPDATE");
    const noop = await updateFaculty(id, retagged, actor.id);
    assert.ok(noop.ok);
    if (noop.ok) {
      check("no fields reported changed", () => assert.deepEqual(noop.changedFields, []));
    }
    versions = await versionsFor(id);
    check("no phantom version written", () => assert.equal(versions.length, 3));
    audit = await auditFor(id);
    check("no phantom activity entry", () => assert.equal(audit.length, 3));

    // ── PUBLISH / UNPUBLISH ───────────────────────────────────────
    console.log("\nPUBLISH / UNPUBLISH");
    assert.ok((await changeFacultyStatus(id, "publish", actor.id)).ok);
    row = await db.faculty.findUniqueOrThrow({ where: { id } });
    check("status is PUBLISHED", () => assert.equal(row.status, ContentStatus.PUBLISHED));
    check("published_at is set", () => assert.ok(row.published_at instanceof Date));
    const firstPublishedAt = row.published_at;

    assert.ok((await changeFacultyStatus(id, "unpublish", actor.id)).ok);
    row = await db.faculty.findUniqueOrThrow({ where: { id } });
    check("back to DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("published_at preserved", () =>
      assert.deepEqual(row.published_at, firstPublishedAt));

    // ── ARCHIVE / RESTORE ─────────────────────────────────────────
    console.log("\nARCHIVE / RESTORE");
    assert.ok((await changeFacultyStatus(id, "archive", actor.id)).ok);
    row = await db.faculty.findUniqueOrThrow({ where: { id } });
    check("status is ARCHIVED", () => assert.equal(row.status, ContentStatus.ARCHIVED));
    check("archived_at is set", () => assert.ok(row.archived_at instanceof Date));

    assert.ok((await changeFacultyStatus(id, "restore", actor.id)).ok);
    row = await db.faculty.findUniqueOrThrow({ where: { id } });
    check("restore returns it to DRAFT", () => assert.equal(row.status, ContentStatus.DRAFT));
    check("archived_at cleared", () => assert.equal(row.archived_at, null));

    // ── ORDERING ──────────────────────────────────────────────────
    console.log("\nORDERING");
    const all = await db.faculty.findMany({
      where: { deleted_at: null },
      orderBy: { display_order: "asc" },
      select: { id: true },
    });
    const reversed = [...all].reverse().map((r) => r.id);
    assert.ok((await reorderFaculty(reversed, actor.id)).ok);

    const after = await db.faculty.findMany({
      where: { deleted_at: null },
      orderBy: { display_order: "asc" },
      select: { id: true, display_order: true },
    });
    check("order follows the supplied sequence", () =>
      assert.deepEqual(after.map((r) => r.id), reversed));
    check("positions are a dense 1..n", () =>
      assert.deepEqual(after.map((r) => r.display_order), after.map((_, i) => i + 1)));

    await reorderFaculty(all.map((r) => r.id), actor.id);

    // ── READS ─────────────────────────────────────────────────────
    console.log("\nREADS");
    const list = await listFaculty();
    check("listFaculty returns ok", () => assert.equal(list.status, "ok"));
    check("list includes expertise as strings", () => {
      if (list.status !== "ok") return;
      const me = list.data.find((f) => f.id === id);
      assert.deepEqual(me?.expertise, ["Gamma", "Delta"]);
    });

    const detail = await getFaculty(id);
    check("getFaculty returns the row with tags in order", () => {
      assert.equal(detail.status, "ok");
      if (detail.status === "ok") {
        assert.equal(detail.data?.fullName, MARKER);
        assert.deepEqual(detail.data?.expertise, ["Gamma", "Delta"]);
      }
    });

    const vs = await getFacultyVersions(id);
    check("version history is newest-first", () =>
      assert.ok(vs.length >= 3 && vs[0].version_number > vs[1].version_number));

    // ── CASCADE ───────────────────────────────────────────────────
    console.log("\nCASCADE");
    await db.faculty.delete({ where: { id } });
    const orphans = await db.facultyExpertise.count({ where: { faculty_id: id } });
    check("deleting a member removes its expertise rows", () =>
      assert.equal(orphans, 0));
    id = ""; // already gone; skip the delete in cleanup

    console.log(`\n✓ ${passed} assertions passed.\n`);
  } finally {
    if (fixtureId) {
      await db.contentVersion
        .deleteMany({ where: { entity_type: FACULTY_ENTITY, entity_id: fixtureId } })
        .catch(() => {});
      await db.auditLog
        .deleteMany({ where: { entity_type: FACULTY_ENTITY, entity_id: fixtureId } })
        .catch(() => {});
    }
    // Reorder logs against a fixed key, not a row id, so it needs its own sweep.
    await db.auditLog
      .deleteMany({ where: { entity_type: FACULTY_ENTITY, action: "faculty.reordered" } })
      .catch(() => {});
    await db.faculty.deleteMany({ where: { full_name: MARKER } }).catch(() => {});
    console.log("  fixture removed.\n");
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.stack : String(err)}\n`);
  exit(1);
});
