/**
 * Rate-limit POLICY — thresholds and pure decision functions.
 *
 * Split out from cms-rate-limit.ts, which carries the `server-only` marker
 * because it touches the database. That marker throws under plain Node, which
 * would make these decisions untestable. Keeping the policy dependency-free
 * means the rules that actually matter can be unit-tested without a database,
 * and the enforcement layer stays a thin wrapper around queries.
 *
 * Contains no secrets and no I/O.
 */

export const LOGIN_LIMITS = {
  /** How far back failures are counted. */
  windowMinutes: 15,
  /** Failures against one email address before it is throttled. */
  maxPerIdentifier: 5,
  /**
   * Failures from one IP before it is throttled. Deliberately generous:
   * a whole office behind NAT shares one address, and a legitimate user
   * must not be locked out by someone else's typos.
   */
  maxPerIp: 30,
  /** Attempt rows older than this are pruned. */
  retentionHours: 24,
} as const;

/**
 * The decision itself. Either dimension crossing its threshold is enough.
 * The comparison is >= so the Nth failure is the one that blocks.
 */
export function isRateLimited(identifierFailures: number, ipFailures: number): boolean {
  return (
    identifierFailures >= LOGIN_LIMITS.maxPerIdentifier ||
    ipFailures >= LOGIN_LIMITS.maxPerIp
  );
}

/**
 * Best-effort client IP, read through a caller-supplied header lookup so this
 * stays free of any framework import.
 *
 * Returns null rather than guessing when no proxy header is present. That
 * matters: a placeholder key would bucket every visitor together, letting one
 * attacker throttle the entire CMS.
 */
export function clientIpFrom(headerLookup: (name: string) => string | null): string | null {
  // Vercel and Firebase App Hosting both set x-forwarded-for; the client's
  // address is the first entry.
  const forwarded = headerLookup("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headerLookup("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return null;
}
