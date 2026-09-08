import { test } from "node:test";
import assert from "node:assert/strict";
import { CmsRole } from "../src/generated/prisma/enums";
import { navFor, visibleHrefs, isActive, NAV_SECTIONS } from "../src/lib/cms-nav";

const { SUPER_ADMIN, CONTENT_ADMIN, CONTENT_EDITOR } = CmsRole;

test("every role sees the dashboard and all three content sections", () => {
  for (const role of [SUPER_ADMIN, CONTENT_ADMIN, CONTENT_EDITOR]) {
    const hrefs = visibleHrefs(role);
    for (const expected of [
      "/cms",
      "/cms/cohort",
      "/cms/success-stories",
      "/cms/faculty",
    ]) {
      assert.ok(hrefs.includes(expected), `${role} should see ${expected}`);
    }
  }
});

test("Super Admin and Content Admin are offered the Activity Log", () => {
  assert.ok(visibleHrefs(SUPER_ADMIN).includes("/cms/activity"));
  assert.ok(visibleHrefs(CONTENT_ADMIN).includes("/cms/activity"));
  assert.ok(!visibleHrefs(CONTENT_EDITOR).includes("/cms/activity"));
});

test("only Super Admin is offered Settings", () => {
  assert.ok(visibleHrefs(SUPER_ADMIN).includes("/cms/settings"));
  for (const role of [CONTENT_ADMIN, CONTENT_EDITOR]) {
    assert.ok(!visibleHrefs(role).includes("/cms/settings"), `${role} must not see settings`);
  }
});

test("empty sections are dropped, not rendered as bare headings", () => {
  // A Content Editor has nothing under "System"; that heading must disappear
  // rather than sit above an empty list. Content Admin now keeps it (Activity).
  assert.ok(!navFor(CONTENT_EDITOR).map((s) => s.title).includes("System"));
  assert.ok(navFor(CONTENT_ADMIN).map((s) => s.title).includes("System"));
  assert.ok(navFor(SUPER_ADMIN).map((s) => s.title).includes("System"));
});

test("Content Admin's System section contains Activity only", () => {
  const system = navFor(CONTENT_ADMIN).find((s) => s.title === "System");
  assert.deepEqual(system?.items.map((i) => i.href), ["/cms/activity"]);
});

test("navFor never returns a section with zero items", () => {
  for (const role of [SUPER_ADMIN, CONTENT_ADMIN, CONTENT_EDITOR]) {
    for (const section of navFor(role)) {
      assert.ok(section.items.length > 0, `empty section for ${role}`);
    }
  }
});

test("filtering never invents links that are not in the master list", () => {
  const all = new Set(NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href)));
  for (const role of [SUPER_ADMIN, CONTENT_ADMIN, CONTENT_EDITOR]) {
    for (const href of visibleHrefs(role)) {
      assert.ok(all.has(href), `${href} is not a declared nav item`);
    }
  }
});

test("dashboard highlighting is exact, section highlighting is prefix-based", () => {
  const dashboard = { href: "/cms", label: "Dashboard", icon: "dashboard" as const, exact: true };
  const faculty = { href: "/cms/faculty", label: "Faculty", icon: "faculty" as const };

  assert.equal(isActive(dashboard, "/cms"), true);
  // Without exact matching the dashboard would stay lit on every child route.
  assert.equal(isActive(dashboard, "/cms/faculty"), false);

  assert.equal(isActive(faculty, "/cms/faculty"), true);
  assert.equal(isActive(faculty, "/cms/faculty/new"), true);
  assert.equal(isActive(faculty, "/cms/faculty-archive"), false, "must not match on prefix alone");
  assert.equal(isActive(faculty, "/cms/cohort"), false);
});
