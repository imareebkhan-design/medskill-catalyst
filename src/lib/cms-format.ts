/**
 * Display formatting for CMS screens. Pure and framework-free, so it can be
 * unit-tested and reused by both server and client components.
 *
 * The database stores values, never formatted strings — every rendering
 * decision lives here.
 */

/**
 * Format a date-only value, e.g. "26 September 2026".
 *
 * Forced to UTC deliberately. A Postgres DATE arrives as midnight UTC; running
 * it through a local-timezone formatter would render 26 September as
 * 25 September for anyone west of UTC. Cohort dates are calendar dates, not
 * instants, so UTC is the correct frame.
 */
export function formatCohortDate(date: Date | string): string {
  // Accepts a canonical "YYYY-MM-DD" string as well as a Date, because values
  // that pass through Next's data cache come back serialised — a Date goes in
  // and a string comes out. Parsing here rather than at each call site means a
  // cached value can never reach Intl as a raw string and throw RangeError.
  const value = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Short form, e.g. "26 Sep 2026".
 *
 * The month name is taken from an explicit table rather than Intl on purpose.
 * en-GB renders September as "Sept", and ICU abbreviations shift between
 * Node/browser versions — but the live homepage says "Sep 26, 2026". Content
 * injected into that page must match its existing copy exactly, so this needs
 * to be deterministic rather than locale-dependent.
 */
export function formatCohortDateShort(date: Date | string): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getUTCDate()} ${SHORT_MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

/**
 * "Sep 26, 2026" — the US-style short form used by the homepage popup and the
 * mobile sticky CTA. A separate function rather than a format flag because the
 * homepage uses four distinct date spellings and each location must keep its
 * own; injecting one spelling everywhere would visibly change the design.
 */
export function formatCohortDateUS(date: Date | string): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  if (Number.isNaN(value.getTime())) return "";
  return `${SHORT_MONTHS[value.getUTCMonth()]} ${value.getUTCDate()}, ${value.getUTCFullYear()}`;
}

/** "Sep 26" — the compact form used by the homepage welcome card. */
export function formatCohortDateCompact(date: Date | string): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  if (Number.isNaN(value.getTime())) return "";
  return `${SHORT_MONTHS[value.getUTCMonth()]} ${value.getUTCDate()}`;
}

/**
 * Turn canonical "HH:mm" into a readable "6:00 PM".
 * Returns null for anything malformed rather than rendering garbage.
 */
export function formatStartTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const suffix = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** How many whole days until a date; negative once it has passed. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const startOfDay = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
}

/** Plain-language countdown for the dashboard. */
export function describeCountdown(date: Date, now: Date = new Date()): string {
  const days = daysUntil(date, now);
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  if (days > 1) return `Starts in ${days} days`;
  if (days === -1) return "Started yesterday";
  return `Started ${Math.abs(days)} days ago`;
}

/** "Today · 3:42 PM", "Yesterday · 9:05 AM", or "12 Aug · 4:00 PM". */
export function formatActivityTime(at: Date, now: Date = new Date()): string {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(at);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(at, now)) return `Today · ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(at, yesterday)) return `Yesterday · ${time}`;

  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(at);
  return `${day} · ${time}`;
}

const ACTION_PHRASES: Record<string, string> = {
  "cohort_setting.updated": "Updated cohort settings",
  "success_story.created": "Added a success story",
  "success_story.updated": "Edited a success story",
  "success_story.published": "Published a success story",
  "success_story.archived": "Archived a success story",
  "faculty.created": "Added a faculty member",
  "faculty.updated": "Edited a faculty member",
  "faculty.published": "Published a faculty member",
  "faculty.archived": "Archived a faculty member",
  "cms_user.created": "Added a team member",
  "cms_user.updated": "Updated a team member",
  "cms.login.throttled": "Repeated failed sign-in attempts",
};

/**
 * Human sentence for an activity row.
 *
 * Falls back to de-slugging the raw action rather than showing it verbatim, so
 * a future action name never surfaces as "faculty.display_order_changed".
 */
export function describeAction(action: string): string {
  const known = ACTION_PHRASES[action];
  if (known) return known;
  return action
    .replace(/^cms\./, "")
    .replace(/[._]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
