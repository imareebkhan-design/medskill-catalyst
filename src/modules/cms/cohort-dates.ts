/**
 * Date conversion between the database's date-only column and the canonical
 * "YYYY-MM-DD" strings that <input type="date"> produces and consumes.
 *
 * Pure and marker-free so it can be unit-tested directly — the off-by-one this
 * guards against is exactly the kind of bug that only shows up in a timezone
 * nobody on the team is sitting in.
 */

/**
 * Anchor a date-only value at UTC midnight.
 *
 * Going through the component parts is deliberate: it is immune to a future
 * refactor introducing local-time parsing, which would silently store the 25th
 * for anyone west of UTC.
 */
export function dateOnlyToUtc(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a stored date back into the value an <input type="date"> expects. */
export function utcToDateOnly(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
