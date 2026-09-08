import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCohortDate,
  formatCohortDateShort,
  formatStartTime,
  daysUntil,
  describeCountdown,
  describeAction,
} from "../src/lib/cms-format";

test("formats a cohort date in full", () => {
  assert.equal(formatCohortDate(new Date("2026-09-26T00:00:00Z")), "26 September 2026");
  assert.equal(formatCohortDateShort(new Date("2026-09-26T00:00:00Z")), "26 Sep 2026");
});

test("date formatting is UTC-locked and cannot slip a day", () => {
  // A Postgres DATE arrives as midnight UTC. Formatted in a negative-offset
  // local zone it would render as the 25th, which is the classic off-by-one
  // this function exists to prevent.
  const midnightUtc = new Date("2026-09-26T00:00:00Z");
  assert.match(formatCohortDate(midnightUtc), /26 September 2026/);

  // Late-evening UTC on the previous day must still be the 25th, not the 26th.
  assert.match(formatCohortDate(new Date("2026-09-25T23:59:59Z")), /25 September 2026/);
});

test("renders 24-hour times as readable 12-hour times", () => {
  assert.equal(formatStartTime("18:00"), "6:00 PM");
  assert.equal(formatStartTime("09:30"), "9:30 AM");
  assert.equal(formatStartTime("00:00"), "12:00 AM");
  assert.equal(formatStartTime("12:00"), "12:00 PM");
  assert.equal(formatStartTime("23:59"), "11:59 PM");
});

test("returns null for missing or malformed times rather than rendering garbage", () => {
  for (const bad of [null, "", "6pm", "25:00", "12:99", "abc", "1830"]) {
    assert.equal(formatStartTime(bad as string | null), null, `should reject ${bad}`);
  }
});

test("counts whole days regardless of time of day", () => {
  const now = new Date("2026-09-01T18:30:00Z");
  assert.equal(daysUntil(new Date("2026-09-01T02:00:00Z"), now), 0);
  assert.equal(daysUntil(new Date("2026-09-02T23:00:00Z"), now), 1);
  assert.equal(daysUntil(new Date("2026-09-26T00:00:00Z"), now), 25);
  assert.equal(daysUntil(new Date("2026-08-30T00:00:00Z"), now), -2);
});

test("describes the countdown in plain language", () => {
  const now = new Date("2026-09-01T10:00:00Z");
  assert.equal(describeCountdown(new Date("2026-09-01T00:00:00Z"), now), "Starts today");
  assert.equal(describeCountdown(new Date("2026-09-02T00:00:00Z"), now), "Starts tomorrow");
  assert.equal(describeCountdown(new Date("2026-09-11T00:00:00Z"), now), "Starts in 10 days");
  assert.equal(describeCountdown(new Date("2026-08-31T00:00:00Z"), now), "Started yesterday");
  assert.equal(describeCountdown(new Date("2026-08-25T00:00:00Z"), now), "Started 7 days ago");
});

test("activity actions read as sentences, never as slugs", () => {
  assert.equal(describeAction("faculty.published"), "Published a faculty member");
  assert.equal(describeAction("cohort_setting.updated"), "Updated cohort settings");

  // Unknown future actions must still be readable rather than raw.
  const unknown = describeAction("faculty.display_order_changed");
  assert.ok(!unknown.includes("."), "no dots should survive");
  assert.ok(!unknown.includes("_"), "no underscores should survive");
  assert.equal(unknown, "Faculty display order changed");
});
