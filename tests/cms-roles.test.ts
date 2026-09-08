import { test } from "node:test";
import assert from "node:assert/strict";
import { CmsRole } from "../src/generated/prisma/enums";
import { roleCan, roleAtLeast, can, ROLE_LABELS } from "../src/lib/cms-roles";

const { SUPER_ADMIN, CONTENT_ADMIN, CONTENT_EDITOR } = CmsRole;

test("Content Editor can draft but cannot publish", () => {
  assert.equal(roleCan(CONTENT_EDITOR, "content:create"), true);
  assert.equal(roleCan(CONTENT_EDITOR, "content:edit"), true);
  assert.equal(roleCan(CONTENT_EDITOR, "content:publish"), false);
  assert.equal(roleCan(CONTENT_EDITOR, "content:archive"), false);
  assert.equal(roleCan(CONTENT_EDITOR, "content:delete"), false);
});

test("Content Admin can publish but cannot manage the team", () => {
  assert.equal(roleCan(CONTENT_ADMIN, "content:publish"), true);
  assert.equal(roleCan(CONTENT_ADMIN, "content:archive"), true);
  assert.equal(roleCan(CONTENT_ADMIN, "content:reorder"), true);
  assert.equal(roleCan(CONTENT_ADMIN, "users:manage"), false);
  assert.equal(roleCan(CONTENT_ADMIN, "settings:access"), false);
  assert.equal(roleCan(CONTENT_ADMIN, "content:delete"), false);
  assert.equal(roleCan(CONTENT_ADMIN, "content:restoreVersion"), false);
});

test("Content Admin can read the activity log", () => {
  assert.equal(roleCan(CONTENT_ADMIN, "activity:view"), true);
});

test("activity access does NOT leak system access to Content Admin", () => {
  // The whole point of the revised matrix: visibility of what changed must
  // not drag settings or user management along with it.
  assert.equal(roleCan(CONTENT_ADMIN, "settings:access"), false);
  assert.equal(roleCan(CONTENT_ADMIN, "users:manage"), false);
});

test("Content Editor still has no activity access", () => {
  assert.equal(roleCan(CONTENT_EDITOR, "activity:view"), false);
});

test("Super Admin holds every capability", () => {
  for (const cap of [
    "content:create",
    "content:edit",
    "content:publish",
    "content:archive",
    "content:delete",
    "content:reorder",
    "content:restoreVersion",
    "users:manage",
    "activity:view",
    "settings:access",
  ] as const) {
    assert.equal(roleCan(SUPER_ADMIN, cap), true, `super admin should hold ${cap}`);
  }
});

test("permanent deletion is Super Admin only", () => {
  assert.equal(roleCan(SUPER_ADMIN, "content:delete"), true);
  assert.equal(roleCan(CONTENT_ADMIN, "content:delete"), false);
  assert.equal(roleCan(CONTENT_EDITOR, "content:delete"), false);
});

test("role hierarchy", () => {
  assert.equal(roleAtLeast(SUPER_ADMIN, CONTENT_EDITOR), true);
  assert.equal(roleAtLeast(CONTENT_ADMIN, CONTENT_EDITOR), true);
  assert.equal(roleAtLeast(CONTENT_EDITOR, CONTENT_ADMIN), false);
  assert.equal(roleAtLeast(CONTENT_EDITOR, CONTENT_EDITOR), true);
});

test("can() treats a missing user as unauthorised", () => {
  assert.equal(can(null, "content:edit"), false);
  assert.equal(can(undefined, "content:edit"), false);
  assert.equal(can({ role: CONTENT_EDITOR }, "content:edit"), true);
});

test("every role has a human-facing label", () => {
  for (const role of Object.values(CmsRole)) {
    assert.ok(ROLE_LABELS[role]?.length > 0);
  }
});
