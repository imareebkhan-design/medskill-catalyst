import { z } from "zod";

/**
 * Faculty validation.
 *
 * Free of `server-only` on purpose, like the cohort and success-story schemas:
 * the same rules run in the browser for feedback and on the server as the gate,
 * so the two can never disagree. Only the server pass is trusted.
 */

export const SHORT_BIO_MAX = 300;
export const MAX_EXPERTISE = 10;
export const EXPERTISE_NAME_MAX = 60;

/** Accepts only absolute http/https URLs — never javascript: or data:. */
function isSafeHttpUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  return parsed.hostname.includes(".");
}

/**
 * Portraits may be an absolute http(s) URL or a site-relative path such as
 * "assets/gagan_victor.jpg", which is how the live page references them.
 * Anything that could execute is rejected.
 */
function isSafeImageRef(value: string): boolean {
  if (/^(javascript|data|vbscript|file):/i.test(value.trim())) return false;
  if (/^https?:\/\//i.test(value)) return isSafeHttpUrl(value);
  if (value.startsWith("//")) return false;
  if (value.includes("..")) return false;
  return /^\/?[\w\-./]+\.(jpg|jpeg|png|webp|avif)$/i.test(value.trim());
}

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

export const facultySchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Enter the mentor's full name.")
    .max(120, "Please keep the name under 120 characters."),

  designation: z
    .string()
    .trim()
    .min(1, "Enter their role, for example “Co-Founder and Program Director”.")
    .max(160, "Please keep the role under 160 characters."),

  organization: optionalText(120, "Please keep this under 120 characters."),

  profile_image_url: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(
        isSafeImageRef,
        "Enter an image address ending in .jpg, .png or .webp — either a full https:// link or a path like assets/name.jpg",
      )
      .optional(),
  ),

  /**
   * Years of experience is a plain number so it can be sorted or filtered
   * later. The wording shown on the site lives in experience_display, because
   * "20+ Years Experience" is copy, not data.
   */
  years_experience: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    },
    z
      .number({ message: "Enter a whole number of years, or leave it blank." })
      .int("Enter a whole number of years.")
      .min(0, "Years of experience cannot be negative.")
      .max(80, "That looks too high — please check.")
      .optional(),
  ),

  experience_display: optionalText(80, "Please keep this under 80 characters."),

  short_bio: optionalText(
    SHORT_BIO_MAX,
    `Please keep the short bio under ${SHORT_BIO_MAX} characters.`,
  ),

  full_bio: optionalText(20000, "This biography is too long to save."),

  /**
   * Expertise capsules. Blank entries are dropped rather than rejected so a
   * half-filled row in the editor never blocks a save.
   */
  expertise: z.preprocess(
    (v) => {
      const list = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
      return list
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((s) => s.length > 0);
    },
    z
      .array(
        z
          .string()
          .max(EXPERTISE_NAME_MAX, `Each tag must be under ${EXPERTISE_NAME_MAX} characters.`),
      )
      .max(MAX_EXPERTISE, `Please use at most ${MAX_EXPERTISE} expertise tags.`),
  ),
});

export type FacultyInput = z.infer<typeof facultySchema>;

/** Exported for direct unit testing of the rules above. */
export const _internal = { isSafeHttpUrl, isSafeImageRef };
