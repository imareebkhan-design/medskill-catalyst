import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cohortSettingsSchema,
  ADMISSIONS_STATUS_OPTIONS,
  ADMISSIONS_STATUSES,
  _internal,
} from "../src/modules/cms/cohort-schema";

const VALID = {
  cohort_name: "MedSkills Catalyst Cohort 5",
  start_date: "2026-09-26",
  start_time: "18:00",
  admissions_status: "OPEN",
  duration: "6 Weeks",
  registration_url: "https://medskillscatalyst.com/enrol",
};

test("accepts a complete, valid cohort", () => {
  const parsed = cohortSettingsSchema.safeParse(VALID);
  assert.equal(parsed.success, true);
});

test("optional fields may be omitted entirely", () => {
  const parsed = cohortSettingsSchema.safeParse({
    cohort_name: "Cohort 6",
    start_date: "2026-01-15",
    start_time: "",
    admissions_status: "COMING_SOON",
    duration: "",
    registration_url: "",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    // Blank optional inputs become undefined, not empty strings, so the
    // service layer stores NULL rather than "".
    assert.equal(parsed.data.start_time, undefined);
    assert.equal(parsed.data.duration, undefined);
    assert.equal(parsed.data.registration_url, undefined);
  }
});

test("cohort name is required and trimmed", () => {
  assert.equal(cohortSettingsSchema.safeParse({ ...VALID, cohort_name: "" }).success, false);
  assert.equal(cohortSettingsSchema.safeParse({ ...VALID, cohort_name: "   " }).success, false);

  const parsed = cohortSettingsSchema.safeParse({ ...VALID, cohort_name: "  Cohort 5  " });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.cohort_name, "Cohort 5");
});

test("start date must be a real calendar date", () => {
  assert.equal(cohortSettingsSchema.safeParse({ ...VALID, start_date: "" }).success, false);
  // Well-shaped but impossible dates must be rejected, not just malformed ones.
  for (const bad of ["2026-02-30", "2026-13-01", "2026-00-10", "2026-09-31", "26-09-2026", "2026/09/26"]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, start_date: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
  // Leap day in a real leap year is valid.
  assert.equal(_internal.isRealDate("2028-02-29"), true);
  assert.equal(_internal.isRealDate("2027-02-29"), false);
});

test("start time must be canonical HH:mm when given", () => {
  for (const good of ["00:00", "09:30", "18:00", "23:59"]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, start_time: good }).success,
      true,
      `should accept ${good}`,
    );
  }
  for (const bad of ["24:00", "18:60", "6pm", "18", "1800", "18:0"]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, start_time: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("admissions status must be one of the four known values", () => {
  for (const status of ADMISSIONS_STATUSES) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, admissions_status: status }).success,
      true,
    );
  }
  for (const bad of ["", "open", "PENDING", "DELETED"]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, admissions_status: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("registration URL must be an absolute http(s) address", () => {
  for (const good of [
    "https://medskillscatalyst.com/enrol",
    "http://example.com",
    "https://sub.example.co.uk/a/b?c=d",
  ]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, registration_url: good }).success,
      true,
      `should accept ${good}`,
    );
  }
  for (const bad of ["medskillscatalyst.com", "/enrol", "https://localhost", "ftp://example.com"]) {
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, registration_url: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("dangerous URL schemes are rejected, not merely well-formed ones", () => {
  // These parse fine as URLs — the protocol allow-list is what stops them
  // becoming a link rendered on the public website.
  for (const hostile of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ]) {
    assert.equal(_internal.isSafeHttpUrl(hostile), false, `must reject ${hostile}`);
    assert.equal(
      cohortSettingsSchema.safeParse({ ...VALID, registration_url: hostile }).success,
      false,
      `schema must reject ${hostile}`,
    );
  }
});

test("every status has a human label and no raw value is shown", () => {
  assert.equal(ADMISSIONS_STATUS_OPTIONS.length, ADMISSIONS_STATUSES.length);
  for (const opt of ADMISSIONS_STATUS_OPTIONS) {
    assert.ok(opt.label.length > 0);
    assert.ok(opt.help.length > 0);
    assert.ok(
      !/[A-Z]{2,}_|_/.test(opt.label),
      `label "${opt.label}" must not expose the raw value`,
    );
  }
});
