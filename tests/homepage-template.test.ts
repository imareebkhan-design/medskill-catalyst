import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOMEPAGE_SENTINELS,
  validateTemplate,
  startMarker,
  endMarker,
} from "../src/lib/homepage-sentinels";

/**
 * Integrity checks against the REAL homepage template.
 *
 * A missing sentinel degrades safely at runtime — the fallback markup renders
 * and nothing crashes — but it fails silently: someone would publish content in
 * the CMS and simply never see it appear. These tests turn that into a loud,
 * immediate failure at `npm test` and at build time.
 *
 * They read `public/index.html` specifically, because that is the file the
 * route handler actually loads.
 */

const root = join(import.meta.dirname, "..");
const RUNTIME_TEMPLATE = join(root, "public", "index.html");
const MIRROR_TEMPLATE = join(root, "index.html");

const runtime = readFileSync(RUNTIME_TEMPLATE, "utf8");

test("the runtime template contains every required sentinel, balanced", () => {
  const problems = validateTemplate(runtime);
  assert.deepEqual(
    problems,
    [],
    `public/index.html is missing or has unbalanced sentinels:\n` +
      problems
        .map((p) => `  ${p.key} (${p.syntax}): ${p.problem} — ${p.starts} start / ${p.ends} end`)
        .join("\n"),
  );
});

test("each sentinel still wraps its original fallback content", () => {
  // The whole safety model rests on the hand-written markup remaining inside
  // the markers. An empty sentinel would render a blank section when the CMS
  // has nothing published.
  const expectations: [string, string, number][] = [
    ["stories.track1", '<div class="success-card">', 3],
    ["stories.track2", '<div class="success-card">', 3],
    ["faculty.cards", '<div class="faculty-card', 4],
  ];

  for (const [key, needle, minimum] of expectations) {
    const open = startMarker(key);
    const close = endMarker(key);
    const block = runtime.split(open)[1]?.split(close)[0] ?? "";
    const count = block.split(needle).length - 1;
    assert.ok(
      count >= minimum,
      `${key} should still contain at least ${minimum} fallback cards, found ${count}`,
    );
  }
});

test("cohort sentinels still wrap a real date", () => {
  for (const key of ["cohort.date.long", "cohort.date.short", "cohort.date.us", "cohort.date.compact"]) {
    const block = runtime.split(startMarker(key))[1]?.split(endMarker(key))[0] ?? "";
    assert.ok(block.trim().length > 0, `${key} fallback must not be empty`);
    assert.match(block, /\d{4}|\d{1,2}/, `${key} fallback should contain a date`);
  }
});

test("the JS sentinel lives inside a script, not as an HTML comment", () => {
  // An HTML comment inside a JS string literal would be inert text and would
  // corrupt the FAQ answer rather than being replaced.
  const open = startMarker("cohort.date.long", "js");
  assert.ok(runtime.includes(open), "the FAQ JS sentinel is missing");
  assert.ok(
    !runtime.includes(`<!-- cms:cohort.date.long:start --><`) ||
      runtime.includes(open),
    "the FAQ date must use JS-comment sentinels",
  );
});

test("the mirrored root index.html carries the same sentinels", () => {
  // Only public/index.html is served, but the two files are kept in sync by
  // convention. Drift here means a future edit to the wrong file silently does
  // nothing.
  const mirror = readFileSync(MIRROR_TEMPLATE, "utf8");
  assert.deepEqual(
    validateTemplate(mirror),
    [],
    "root index.html has drifted from the runtime template's sentinels",
  );
});

test("the manifest covers every content area the homepage renders", () => {
  const keys = new Set(HOMEPAGE_SENTINELS.map((s) => s.key));
  for (const required of [
    "cohort.date.long",
    "cohort.date.short",
    "cohort.date.us",
    "cohort.date.compact",
    "stories.track1",
    "stories.track2",
    "faculty.cards",
  ]) {
    assert.ok(keys.has(required), `manifest is missing ${required}`);
  }
});
