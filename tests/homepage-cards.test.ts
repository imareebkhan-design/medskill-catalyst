import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderStoryCard,
  renderStoryTrack,
  renderFacultyCard,
  renderFacultyGrid,
  splitIntoTracks,
  safeImageSrc,
  safeLinkHref,
} from "../src/lib/homepage-cards";
import type { PublicFaculty, PublicStory } from "../src/lib/site-content";

const story = (over: Partial<PublicStory> = {}): PublicStory => ({
  id: "s1",
  fullName: "Anand Gupta",
  profileImageUrl: "assets/anand_gupta.png",
  linkedinUrl: "https://www.linkedin.com/in/anand",
  growthHeadline: "MedTech Marketing → Founder",
  previousDesignation: "Marketing Manager",
  previousCompany: "Medtronic India",
  currentDesignation: "Founder",
  currentCompany: "Sarathi Consulting",
  shortDescription: null,
  testimonial: "A great programme.",
  ...over,
});

const member = (over: Partial<PublicFaculty> = {}): PublicFaculty => ({
  id: "f1",
  fullName: "Gagan Victor",
  designation: "Co-Founder and Program Director",
  organization: null,
  profileImageUrl: "assets/gagan_victor.jpg",
  experienceDisplay: null,
  shortBio: null,
  fullBio: "Former leader at Pfizer.",
  expertise: ["Career Coach", "Podcaster"],
  ...over,
});

// ── Story markup ─────────────────────────────────────────────────────

test("story card reproduces the existing class structure", () => {
  const html = renderStoryCard(story());
  for (const cls of [
    'class="success-card"',
    "success-card-top",
    "success-badge-verified",
    "success-profile-row",
    "success-avatar-img",
    "success-card-name",
    "success-card-category",
    "growth-journey",
    "node-before",
    "node-after",
    "success-testimonial-text",
    "success-story-toggle-btn",
  ]) {
    assert.ok(html.includes(cls), `missing ${cls}`);
  }
});

test("story card keeps the toggleTestimonial hook the page's JS relies on", () => {
  assert.ok(renderStoryCard(story()).includes('onclick="toggleTestimonial(this)"'));
});

test("role and company are joined the way the original markup shows them", () => {
  const html = renderStoryCard(story());
  assert.ok(html.includes("Marketing Manager, Medtronic India"));
  assert.ok(html.includes("Founder, Sarathi Consulting"));
});

test("a missing company renders the role alone, with no dangling comma", () => {
  const html = renderStoryCard(story({ previousCompany: null }));
  assert.ok(html.includes(">Marketing Manager<"));
  assert.ok(!html.includes("Marketing Manager,"));
});

test("optional fields absent do not produce empty or broken markup", () => {
  const html = renderStoryCard(
    story({
      profileImageUrl: null,
      linkedinUrl: null,
      growthHeadline: null,
      testimonial: null,
      shortDescription: null,
      previousDesignation: null,
      previousCompany: null,
      currentDesignation: null,
      currentCompany: null,
    }),
  );
  assert.ok(html.includes("Anand Gupta"));
  assert.ok(!html.includes("<img"), "no image element when there is no image");
  assert.ok(!html.includes("undefined"));
  assert.ok(!html.includes("null"));
  assert.ok(!html.includes("growth-journey"), "no empty journey block");
  assert.ok(!html.includes("success-testimonial-text"), "no empty quote block");
});

test("story content is HTML-escaped", () => {
  const html = renderStoryCard(
    story({ fullName: '<img src=x onerror="alert(1)">', testimonial: "5 > 3 & rising" }),
  );
  assert.ok(!html.includes("<img src=x"), "markup must not survive");
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("&amp; rising"));
});

// ── Image and link safety ────────────────────────────────────────────

test("unsafe image protocols are dropped entirely", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "vbscript:x", "file:///etc"]) {
    assert.equal(safeImageSrc(bad), null, `must reject ${bad}`);
    assert.ok(!renderStoryCard(story({ profileImageUrl: bad })).includes("<img"));
  }
});

test("image paths are normalised the way the original markup writes them", () => {
  assert.equal(safeImageSrc("assets/a.png"), "assets/a.png");
  assert.equal(safeImageSrc("/assets/a.png"), "assets/a.png");
  assert.equal(safeImageSrc("https://cdn.example.com/a.png"), "https://cdn.example.com/a.png");
  assert.equal(safeImageSrc("//evil.com/a.png"), null);
  assert.equal(safeImageSrc("../../etc/passwd"), null);
  assert.equal(safeImageSrc(null), null);
  assert.equal(safeImageSrc("  "), null);
});

test("only absolute http(s) links become anchors", () => {
  assert.equal(safeLinkHref("https://linkedin.com/in/x"), "https://linkedin.com/in/x");
  assert.equal(safeLinkHref("javascript:alert(1)"), null);
  assert.equal(safeLinkHref("/in/x"), null);
  assert.ok(!renderStoryCard(story({ linkedinUrl: "javascript:alert(1)" })).includes("<a "));
});

// ── Track distribution ───────────────────────────────────────────────

test("six stories split 3/3, reproducing the current homepage", () => {
  const [a, b] = splitIntoTracks([1, 2, 3, 4, 5, 6]);
  assert.deepEqual(a, [1, 2, 3]);
  assert.deepEqual(b, [4, 5, 6]);
});

test("splitting preserves order and puts the extra card in the first track", () => {
  assert.deepEqual(splitIntoTracks([1, 2, 3, 4, 5]), [[1, 2, 3], [4, 5]]);
  assert.deepEqual(splitIntoTracks([1]), [[1], []]);
  assert.deepEqual(splitIntoTracks([]), [[], []]);
});

test("an empty track yields null so the fallback row survives", () => {
  assert.equal(renderStoryTrack([]), null);
  assert.ok(renderStoryTrack([story()])?.includes("success-card"));
});

// ── Faculty markup ───────────────────────────────────────────────────

test("faculty card reproduces the existing class structure and animation hook", () => {
  const html = renderFacultyCard(member());
  for (const cls of [
    "faculty-card fade-up",
    "faculty-av-wrap",
    "faculty-portrait-container",
    "faculty-portrait",
    "faculty-details",
    "faculty-name",
    "faculty-role",
    "faculty-badges",
    "faculty-badge",
    "faculty-bio",
  ]) {
    assert.ok(html.includes(cls), `missing ${cls}`);
  }
});

test("expertise tags render in order, one badge each", () => {
  const html = renderFacultyCard(member({ expertise: ["One", "Two", "Three"] }));
  assert.equal(html.split('class="faculty-badge"').length - 1, 3);
  assert.ok(html.indexOf("One") < html.indexOf("Two"));
  assert.ok(html.indexOf("Two") < html.indexOf("Three"));
});

test("organisation is appended to the role when present", () => {
  assert.ok(
    renderFacultyCard(member({ organization: "MedSkills" })).includes(
      "Co-Founder and Program Director, MedSkills",
    ),
  );
});

test("faculty optional fields absent do not break the card", () => {
  const html = renderFacultyCard(
    member({ profileImageUrl: null, fullBio: null, shortBio: null, expertise: [] }),
  );
  assert.ok(html.includes("Gagan Victor"));
  assert.ok(html.includes("faculty-portrait-container"), "container keeps grid sizing");
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("faculty-badges"), "no empty badge row");
  assert.ok(!html.includes("faculty-bio"), "no empty bio paragraph");
  assert.ok(!html.includes("undefined") && !html.includes("null"));
});

test("faculty content is HTML-escaped", () => {
  const html = renderFacultyCard(
    member({ fullName: "<script>alert(1)</script>", expertise: ["A & B"] }),
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("A &amp; B"));
});

test("an empty faculty list yields null so the fallback grid survives", () => {
  assert.equal(renderFacultyGrid([]), null);
  assert.ok(renderFacultyGrid([member()])?.includes("faculty-card"));
});
