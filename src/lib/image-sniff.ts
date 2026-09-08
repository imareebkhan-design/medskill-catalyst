/**
 * Image type detection from file contents.
 *
 * Pure and dependency-free so the security-critical check can be unit-tested
 * without a server or storage.
 *
 * The browser-supplied `file.type` is not trusted: it is attacker-controlled
 * and trivially set to "image/png" on any payload. These signatures decide what
 * a file actually is, and the extension written to storage is derived from the
 * result — never from the uploaded filename.
 */

export const ALLOWED_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Returns the detected MIME type, or null when the bytes are not a supported image. */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" ...size... "WEBP"
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...Array.from(bytes.slice(from, to)));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";

  return null;
}

/** File extension for a detected type, or null if unsupported. */
export function extensionFor(mime: string | null): string | null {
  return mime ? (ALLOWED_IMAGE_MIME[mime] ?? null) : null;
}
