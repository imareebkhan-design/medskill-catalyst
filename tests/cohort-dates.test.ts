import { test } from "node:test";
import assert from "node:assert/strict";
import { dateOnlyToUtc, utcToDateOnly } from "../src/modules/cms/cohort-dates";
import { formatCohortDate } from "../src/lib/cms-format";

test("a date-only string is stored at UTC midnight", () => {
  const d = dateOnlyToUtc("2026-09-26");
  assert.equal(d.toISOString(), "2026-09-26T00:00:00.000Z");
});

test("round-trips without drifting", () => {
  for (const value of ["2026-09-26", "2026-01-01", "2026-12-31", "2028-02-29"]) {
    assert.equal(utcToDateOnly(dateOnlyToUtc(value)), value, `drifted on ${value}`);
  }
});

test("pads single-digit months and days", () => {
  assert.equal(utcToDateOnly(dateOnlyToUtc("2026-01-05")), "2026-01-05");
  assert.equal(utcToDateOnly(new Date(Date.UTC(2026, 0, 5))), "2026-01-05");
});

test("the stored date renders as the same calendar day the admin picked", () => {
  // The whole point of the UTC anchoring: an admin who picks 26 September must
  // see "26 September 2026" on the website, never the 25th.
  const stored = dateOnlyToUtc("2026-09-26");
  assert.equal(formatCohortDate(stored), "26 September 2026");
  assert.equal(utcToDateOnly(stored), "2026-09-26");
});

test("year boundaries do not roll over", () => {
  const newYearsEve = dateOnlyToUtc("2026-12-31");
  assert.equal(utcToDateOnly(newYearsEve), "2026-12-31");
  assert.equal(formatCohortDate(newYearsEve), "31 December 2026");

  const newYearsDay = dateOnlyToUtc("2027-01-01");
  assert.equal(utcToDateOnly(newYearsDay), "2027-01-01");
  assert.equal(formatCohortDate(newYearsDay), "1 January 2027");
});
