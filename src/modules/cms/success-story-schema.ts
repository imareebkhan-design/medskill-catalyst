import { z } from "zod";

/**
 * Success Story validation.
 *
 * Like the cohort schema, this is free of `server-only` on purpose: the same
 * rules run in the browser for instant feedback and on the server as the
 * actual gate, so the two can never disagree. Only the server one is trusted.
 */

export const ALUMNI_CATEGORIES = ["COHORT_ALUMNI", "ADVANCED_MODULE_ALUMNI"] as const;
export type AlumniCategoryValue = (typeof ALUMNI_CATEGORIES)[number];

export const CATEGORY_OPTIONS: {
  value: AlumniCategoryValue;
  label: string;
  help: string;
}[] = [
  {
    value: "COHORT_ALUMNI",
    label: "Cohort Alumni",
    help: "Graduates of the main cohort programme.",
  },
  {
    value: "ADVANCED_MODULE_ALUMNI",
    label: "Advanced Module Alumni",
    help: "Graduates of the advanced module.",
  },
];

export const SHORT_DESCRIPTION_MAX = 250;

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
 * Profile images may be either an absolute http(s) URL or a site-relative
 * path such as "assets/anand_gupta.png", which is how the existing public
 * content references them. Anything that could execute is rejected.
 */
function isSafeImageRef(value: string): boolean {
  if (/^(javascript|data|vbscript|file):/i.test(value.trim())) return false;
  if (/^https?:\/\//i.test(value)) return isSafeHttpUrl(value);
  // Relative path: no protocol, no scheme-relative "//", no traversal.
  if (value.startsWith("//")) return false;
  if (value.includes("..")) return false;
  return /^\/?[\w\-./]+\.(jpg|jpeg|png|webp|avif)$/i.test(value.trim());
}

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = (max: number, message: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, message).optional());

export const successStorySchema = z.object({
  category: z.enum(ALUMNI_CATEGORIES, {
    message: "Choose which group this alumnus belongs to.",
  }),

  full_name: z
    .string()
    .trim()
    .min(1, "Enter the alumnus's full name.")
    .max(120, "Please keep the name under 120 characters."),

  profile_image_url: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(
        isSafeImageRef,
        "Enter an image address ending in .jpg, .png or .webp — either a full https:// link or a path like assets/name.png",
      )
      .optional(),
  ),

  linkedin_url: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(
        isSafeHttpUrl,
        "Enter the full LinkedIn address, starting with https://",
      )
      .optional(),
  ),

  previous_designation: optionalText(120, "Please keep this under 120 characters."),
  previous_company: optionalText(120, "Please keep this under 120 characters."),
  current_designation: optionalText(120, "Please keep this under 120 characters."),
  current_company: optionalText(120, "Please keep this under 120 characters."),

  growth_headline: optionalText(
    160,
    "Please keep the headline under 160 characters.",
  ),
  growth_description: optionalText(2000, "Please keep this under 2000 characters."),

  short_description: optionalText(
    SHORT_DESCRIPTION_MAX,
    `Please keep the card summary under ${SHORT_DESCRIPTION_MAX} characters.`,
  ),

  full_story: optionalText(20000, "This story is too long to save."),
  testimonial: optionalText(4000, "Please keep the testimonial under 4000 characters."),
});

export type SuccessStoryInput = z.infer<typeof successStorySchema>;

/** Exported for direct unit testing of the rules above. */
export const _internal = { isSafeHttpUrl, isSafeImageRef };
