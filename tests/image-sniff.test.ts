import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageMime, extensionFor } from "../src/lib/image-sniff";
import { _internal } from "../src/modules/cms/success-story-schema";

/** Minimal byte sequences carrying each format's real signature. */
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const WEBP = new Uint8Array([
  ...[0x52, 0x49, 0x46, 0x46], // "RIFF"
  ...[0x24, 0, 0, 0], // size
  ...[0x57, 0x45, 0x42, 0x50], // "WEBP"
]);

test("detects JPEG, PNG and WebP from their signatures", () => {
  assert.equal(sniffImageMime(JPEG), "image/jpeg");
  assert.equal(sniffImageMime(PNG), "image/png");
  assert.equal(sniffImageMime(WEBP), "image/webp");
});

test("maps each detected type to the right extension", () => {
  assert.equal(extensionFor("image/jpeg"), "jpg");
  assert.equal(extensionFor("image/png"), "png");
  assert.equal(extensionFor("image/webp"), "webp");
  assert.equal(extensionFor(null), null);
  assert.equal(extensionFor("image/gif"), null, "GIF is outside the allowed set");
  assert.equal(extensionFor("image/svg+xml"), null, "SVG can carry script — must stay out");
});

test("rejects non-image payloads regardless of what they claim to be", () => {
  const cases: [string, Uint8Array][] = [
    ["HTML", new TextEncoder().encode("<html><script>alert(1)</script></html>")],
    ["SVG", new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
    ["PDF", new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0])],
    ["GIF", new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0, 0])],
    ["ZIP", new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0])],
    ["ELF", new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0])],
  ];
  for (const [label, bytes] of cases) {
    assert.equal(sniffImageMime(bytes), null, `${label} must be rejected`);
  }
});

test("a renamed script is still rejected — the extension is never trusted", () => {
  // The classic attack: evil.php renamed evil.png with a PNG-ish name but no
  // PNG signature. Detection is from bytes, so this cannot get through.
  const disguised = new TextEncoder().encode("<?php system($_GET['c']); ?>          ");
  assert.equal(sniffImageMime(disguised), null);
});

test("truncated or empty input is rejected rather than guessed", () => {
  assert.equal(sniffImageMime(new Uint8Array([])), null);
  assert.equal(sniffImageMime(new Uint8Array([0xff, 0xd8])), null, "too short to classify");
  assert.equal(sniffImageMime(PNG.slice(0, 6)), null);
});

test("a RIFF container that is not WebP is rejected", () => {
  // RIFF also fronts WAV and AVI; only the WEBP fourcc counts.
  const wav = new Uint8Array([
    ...[0x52, 0x49, 0x46, 0x46],
    ...[0x24, 0, 0, 0],
    ...[0x57, 0x41, 0x56, 0x45], // "WAVE"
  ]);
  assert.equal(sniffImageMime(wav), null);
});

test("a Supabase public storage URL passes the stored-value validator", () => {
  // Backward compatibility both ways: the uploader writes a full https URL into
  // the same column that previously held relative paths, so the schema must
  // accept both shapes.
  const uploaded =
    "https://abcdefghijklmnopqrst.supabase.co/storage/v1/object/public/site-assets/alumni/8f14e45f.png";
  assert.equal(_internal.isSafeImageRef(uploaded), true);
  assert.equal(_internal.isSafeImageRef("assets/anand_gupta.png"), true, "legacy path still valid");
});
