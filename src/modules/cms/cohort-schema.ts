import { z } from "zod";

/**
 * Cohort Settings validation.
 *
 * Deliberately free of `server-only` and of any Prisma import: the SAME schema
 * runs in the browser for instant feedback and on the server as the actual
 * gate. One definition means the two can never disagree — and the server one
 * is the only one that is trusted.
 */

export const ADMISSIONS_STATUSES = [
  "OPEN",
  "CLOSING_SOON",
  "CLOSED",
  "COMING_SOON",
] as const;

export type AdmissionsStatusValue = (typeof ADMISSIONS_STATUSES)[number];

/** Human labels. Raw enum values are never shown to a user. */
export const ADMISSIONS_STATUS_OPTIONS: {
  value: AdmissionsStatusValue;
  label: string;
  help: string;
}[] = [
  { value: "OPEN", label: "Open", help: "Anyone can apply right now." },
  {
    value: "CLOSING_SOON",
    label: "Closing soon",
    help: "Still open, but nearly full — adds urgency on the website.",
  },
  { value: "CLOSED", label: "Closed", help: "No longer accepting applications." },
  {
    value: "COMING_SOON",
    label: "Coming soon",
    help: "Announced, but applications have not opened yet.",
  },
];

/** Canonical date-only string, as produced by <input type="date">. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Canonical 24-hour time, as produced by <input type="time">. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * True when the string is a real calendar date, not merely well-shaped.
 * Rejects 2026-02-30 and 2026-13-01, which the regex alone would accept.
 */
function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const asDate = new Date(Date.UTC(y, m - 1, d));
  return (
    asDate.getUTCFullYear() === y &&
    asDate.getUTCMonth() === m - 1 &&
    asDate.getUTCDate() === d
  );
}

/**
 * Accepts only http/https absolute URLs.
 *
 * Not z.url(): that would accept `javascript:alert(1)` and `data:` URLs, which
 * end up rendered as a link on the public site. Protocol allow-listing is the
 * point of this check, not URL shape.
 */
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

/** Treat "" from an untouched optional input as "not provided". */
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

export const cohortSettingsSchema = z.object({
  cohort_name: z
    .string()
    .trim()
    .min(1, "Give the cohort a name, for example “MedSkills Catalyst Cohort 5”.")
    .max(120, "Please keep the cohort name under 120 characters."),

  start_date: z
    .string()
    .trim()
    .min(1, "Choose the date the cohort starts.")
    .refine(isRealDate, "That is not a real date. Please pick one from the calendar."),

  start_time: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(TIME_RE, "Enter a time like 18:00, or leave it blank.")
      .optional(),
  ),

  admissions_status: z.enum(ADMISSIONS_STATUSES, {
    message: "Choose an admissions status.",
  }),

  duration: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(60, "Please keep the duration under 60 characters.").optional(),
  ),

  registration_url: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(
        isSafeHttpUrl,
        "Enter a full web address starting with https:// — for example https://medskillscatalyst.com/enrol",
      )
      .optional(),
  ),
});

export type CohortSettingsInput = z.infer<typeof cohortSettingsSchema>;

/** Exported for direct unit testing of the rules above. */
export const _internal = { isRealDate, isSafeHttpUrl };
