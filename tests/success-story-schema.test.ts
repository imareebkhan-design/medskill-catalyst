import { test } from "node:test";
import assert from "node:assert/strict";
import {
  successStorySchema,
  ALUMNI_CATEGORIES,
  CATEGORY_OPTIONS,
  SHORT_DESCRIPTION_MAX,
  _internal,
} from "../src/modules/cms/success-story-schema";

const VALID = {
  category: "COHORT_ALUMNI",
  full_name: "Anand Gupta",
  profile_image_url: "assets/anand_gupta.png",
  linkedin_url: "https://www.linkedin.com/in/anand-gupta-79326a66",
  previous_designation: "Marketing Manager",
  previous_company: "Medtronic India",
  current_designation: "Founder",
  current_company: "Sarathi Consulting Solutions",
  growth_headline: "MedTech Marketing → Founder",
  growth_description: "",
  short_description: "",
  full_story: "",
  testimonial: "A quote.",
};

test("accepts a complete story", () => {
  assert.equal(successStorySchema.safeParse(VALID).success, true);
});

test("only the name and category are required", () => {
  const minimal = {
    category: "ADVANCED_MODULE_ALUMNI",
    full_name: "Someone",
    profile_image_url: "",
    linkedin_url: "",
    previous_designation: "",
    previous_company: "",
    current_designation: "",
    current_company: "",
    growth_headline: "",
    growth_description: "",
    short_description: "",
    full_story: "",
    testimonial: "",
  };
  const parsed = successStorySchema.safeParse(minimal);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    // Blank optionals become undefined so the service stores NULL, not "".
    assert.equal(parsed.data.testimonial, undefined);
    assert.equal(parsed.data.profile_image_url, undefined);
    assert.equal(parsed.data.linkedin_url, undefined);
  }
});

test("name is required and trimmed", () => {
  assert.equal(successStorySchema.safeParse({ ...VALID, full_name: "" }).success, false);
  assert.equal(successStorySchema.safeParse({ ...VALID, full_name: "   " }).success, false);
  const parsed = successStorySchema.safeParse({ ...VALID, full_name: "  Anand  " });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.full_name, "Anand");
});

test("category must be one of the two known groups", () => {
  for (const c of ALUMNI_CATEGORIES) {
    assert.equal(successStorySchema.safeParse({ ...VALID, category: c }).success, true);
  }
  for (const bad of ["", "cohort_alumni", "ALUMNI", "OTHER"]) {
    assert.equal(
      successStorySchema.safeParse({ ...VALID, category: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("LinkedIn must be an absolute http(s) address", () => {
  for (const good of ["https://www.linkedin.com/in/x", "http://linkedin.com/in/y"]) {
    assert.equal(successStorySchema.safeParse({ ...VALID, linkedin_url: good }).success, true);
  }
  for (const bad of ["linkedin.com/in/x", "/in/x", "ftp://linkedin.com"]) {
    assert.equal(
      successStorySchema.safeParse({ ...VALID, linkedin_url: bad }).success,
      false,
      `should reject ${bad}`,
    );
  }
});

test("dangerous URL schemes are rejected in both URL fields", () => {
  for (const hostile of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ]) {
    assert.equal(_internal.isSafeHttpUrl(hostile), false, `linkedin must reject ${hostile}`);
    assert.equal(_internal.isSafeImageRef(hostile), false, `image must reject ${hostile}`);
    assert.equal(
      successStorySchema.safeParse({ ...VALID, linkedin_url: hostile }).success,
      false,
    );
    assert.equal(
      successStorySchema.safeParse({ ...VALID, profile_image_url: hostile }).success,
      false,
    );
  }
});

test("profile image accepts relative site paths and absolute URLs", () => {
  for (const good of [
    "assets/anand_gupta.png",
    "/assets/anand_gupta.png",
    "assets/x.webp",
    "https://cdn.example.com/a/b.jpg",
  ]) {
    assert.equal(_internal.isSafeImageRef(good), true, `should accept ${good}`);
  }
});

test("profile image rejects traversal, scheme-relative and non-images", () => {
  for (const bad of [
    "../../etc/passwd.png",
    "//evil.com/x.png",
    "assets/script.js",
    "assets/no-extension",
  ]) {
    assert.equal(_internal.isSafeImageRef(bad), false, `should reject ${bad}`);
  }
});

test("card summary is capped at the documented length", () => {
  const ok = "x".repeat(SHORT_DESCRIPTION_MAX);
  const tooLong = "x".repeat(SHORT_DESCRIPTION_MAX + 1);
  assert.equal(successStorySchema.safeParse({ ...VALID, short_description: ok }).success, true);
  assert.equal(
    successStorySchema.safeParse({ ...VALID, short_description: tooLong }).success,
    false,
  );
});

test("every category has a human label that hides the raw value", () => {
  assert.equal(CATEGORY_OPTIONS.length, ALUMNI_CATEGORIES.length);
  for (const opt of CATEGORY_OPTIONS) {
    assert.ok(opt.label.length > 0 && opt.help.length > 0);
    assert.ok(!/_/.test(opt.label), `label "${opt.label}" leaks the raw enum value`);
  }
});
