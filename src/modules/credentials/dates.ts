import { CREDENTIAL_TIMEZONE } from "./config";

/**
 * Date-only helpers. DATE columns come back from Prisma as JS Dates at UTC
 * midnight; everything here treats them as calendar dates, never instants.
 */

export function parseISODate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollovers such as 2026-02-31.
  return d.toISOString().slice(0, 10) === s ? d : null;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The calendar date of an instant in India (issue dates, "today"). */
export function indianDate(instant: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CREDENTIAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  return new Date(`${parts}T00:00:00.000Z`);
}

export function indianYear(instant: Date): number {
  return indianDate(instant).getUTCFullYear();
}

/** Add calendar months, clamping to the last day (31 Jan + 1 month → 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/** "15 July 2026" — the format printed on certificates and shown publicly. */
export function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}
