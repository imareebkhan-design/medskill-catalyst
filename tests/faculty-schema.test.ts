import { test } from "node:test";
import assert from "node:assert/strict";
import {
  facultySchema,
  MAX_EXPERTISE,
  EXPERTISE_NAME_MAX,
  SHORT_BIO_MAX,
  _internal,
} from "../src/modules/cms/faculty-schema";

const VALID = {
  full_name: "Gagan Victor",
  designation: "Co-Founder and Program Director",
  organization: "MedSkills Catalyst",
  profile_image_url: "assets/gagan_victor.jpg",
  years_experience: "20",
  experience_display: "20+ Years Experience",
  short_bio: "Short bio.",
  full_bio: "Full biography.",
  expertise: ["Career Coach", "Podcaster"],
};

test("accepts a complete faculty member", () => {
  assert.equal(facultySchema.safeParse(VALID).success, true);
});

test("only name and role are required", () => {
  const minimal = {
    full_name: "Tabish",
    designation: "L&D Specialist",
    organization: "",
    profile_image_url: "",
    years_experience: "",
    experience_display: "",
    short_bio: "",
    full_bio: "",
    expertise: [],
  };
  const parsed = facultySchema.safeParse(minimal);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    // Blank optionals become undefined so the service stores NULL, not "".
    assert.equal(parsed.data.organization, undefined);
    assert.equal(parsed.data.years_experience, undefined);
    assert.equal(parsed.data.full_bio, undefined);
    assert.deepEqual(parsed.data.expertise, []);
  }
});

test("name and role are required and trimmed", () => {
  assert.equal(facultySchema.safeParse({ ...VALID, full_name: "" }).success, false);
  assert.equal(facultySchema.safeParse({ ...VALID, full_name: "   " }).success, false);
  assert.equal(facultySchema.safeParse({ ...VALID, designation: "" }).success, false);

  const parsed = facultySchema.safeParse({ ...VALID, full_name: "  Tabish  " });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.full_name, "Tabish");
});

test("years of experience must be a sensible whole number", () => {
  for (const good of ["0", "12", "80"]) {
    assert.equal(
      facultySchema.safeParse({ ...VALID, years_experience: good }).success,
      true,
      `should accept ${good}`,
    );
  }
  for (const bad of ["-1", "81", "12.5", "twenty", "20 years"]) {
    assert.equal(
      facultySchema.safeParse({ ...VALID, years_experience: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("years of experience coerces a numeric string to a number", () => {
  const parsed = facultySchema.safeParse({ ...VALID, years_experience: "25" });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.years_experience, 25);
    assert.equal(typeof parsed.data.years_experience, "number");
  }
});

test("dangerous URL schemes are rejected for the portrait", () => {
  for (const hostile of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ]) {
    assert.equal(_internal.isSafeImageRef(hostile), false, `must reject ${hostile}`);
    assert.equal(
      facultySchema.safeParse({ ...VALID, profile_image_url: hostile }).success,
      false,
    );
  }
});

test("portrait accepts relative paths and absolute URLs, rejects traversal", () => {
  for (const good of ["assets/tabish.jpg", "/assets/x.png", "https://cdn.example.com/a.webp"]) {
    assert.equal(_internal.isSafeImageRef(good), true, `should accept ${good}`);
  }
  for (const bad of ["../../etc/passwd.png", "//evil.com/x.png", "assets/script.js"]) {
    assert.equal(_internal.isSafeImageRef(bad), false, `should reject ${bad}`);
  }
});

test("blank expertise entries are dropped, not rejected", () => {
  const parsed = facultySchema.safeParse({
    ...VALID,
    expertise: ["  Career Coach  ", "", "   ", "Podcaster"],
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.deepEqual(parsed.data.expertise, ["Career Coach", "Podcaster"]);
  }
});

test("a single expertise value is accepted as a list", () => {
  // FormData.getAll can yield one entry; it must not be treated as characters.
  const parsed = facultySchema.safeParse({ ...VALID, expertise: "Career Coach" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.deepEqual(parsed.data.expertise, ["Career Coach"]);
});

test("expertise is capped in count and length", () => {
  const tooMany = Array.from({ length: MAX_EXPERTISE + 1 }, (_, i) => `Tag ${i}`);
  assert.equal(facultySchema.safeParse({ ...VALID, expertise: tooMany }).success, false);

  const tooLong = ["x".repeat(EXPERTISE_NAME_MAX + 1)];
  assert.equal(facultySchema.safeParse({ ...VALID, expertise: tooLong }).success, false);

  const atLimit = Array.from({ length: MAX_EXPERTISE }, (_, i) => `Tag ${i}`);
  assert.equal(facultySchema.safeParse({ ...VALID, expertise: atLimit }).success, true);
});

test("short bio is capped at the documented length", () => {
  const ok = "x".repeat(SHORT_BIO_MAX);
  const tooLong = "x".repeat(SHORT_BIO_MAX + 1);
  assert.equal(facultySchema.safeParse({ ...VALID, short_bio: ok }).success, true);
  assert.equal(facultySchema.safeParse({ ...VALID, short_bio: tooLong }).success, false);
});
