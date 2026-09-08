/**
 * Sliding-window rate limiting for CMS sign-in.
 *
 * Stored in Postgres rather than memory because the app runs on serverless
 * hosts (Vercel functions, Firebase App Hosting) where every instance has its
 * own heap — an in-process counter would reset constantly and be trivially
 * outrun by an attacker hitting a fresh instance.
 *
 * Two independent dimensions are counted:
 *
 *   identifier (email) — the real control. Bounded and non-spoofable, since
 *                        the attacker must submit the address they are
 *                        guessing against.
 *   ip                 — a speed bump only. X-Forwarded-For is attacker-
 *                        controllable, so a determined attacker can rotate it
 *                        and evade this dimension entirely. It is included
 *                        because it cheaply stops naive scripted floods, not
 *                        because it is a boundary.
 *
 * Applies to the CMS only. The CRM's passcode login (src/lib/auth.ts) is a
 * separate system and is deliberately untouched by this module.
 */

import "server-only";
import { db } from "@/src/lib/db";
import {
  LOGIN_LIMITS,
  isRateLimited,
  clientIpFrom,
} from "@/src/lib/cms-rate-limit-policy";

// Re-exported so callers have a single import site for rate limiting.
export { LOGIN_LIMITS, isRateLimited, clientIpFrom };

function windowStart(): Date {
  return new Date(Date.now() - LOGIN_LIMITS.windowMinutes * 60 * 1000);
}

/**
 * True when this attempt should be refused before any password work happens.
 *
 * Fails OPEN on a database error. That is deliberate: the login path needs the
 * database anyway (to read cms_users), so a failure here means login is broken
 * regardless — and failing closed would turn any brief database hiccup into a
 * total lockout of the CMS. The error is logged so it cannot pass unnoticed.
 */
export async function isLoginThrottled(
  identifier: string,
  ip: string | null,
): Promise<boolean> {
  const since = windowStart();
  try {
    const [identifierFailures, ipFailures] = await Promise.all([
      db.cmsLoginAttempt.count({
        where: { identifier, created_at: { gte: since } },
      }),
      ip
        ? db.cmsLoginAttempt.count({ where: { ip, created_at: { gte: since } } })
        : Promise.resolve(0),
    ]);
    return isRateLimited(identifierFailures, ipFailures);
  } catch (err) {
    console.error("[cms] rate-limit check failed; allowing the attempt:", err);
    return false;
  }
}

/**
 * Record one failed attempt. Called for every failure — including attempts
 * against addresses with no account, so that the limiter cannot be used to
 * discover which addresses exist.
 */
export async function recordLoginFailure(
  identifier: string,
  ip: string | null,
): Promise<void> {
  try {
    await db.cmsLoginAttempt.create({
      data: { identifier: identifier.slice(0, 320), ip },
    });
  } catch (err) {
    console.error("[cms] could not record a failed login attempt:", err);
  }
}

/**
 * Clear the identifier's failures after a successful sign-in.
 *
 * Only the email dimension is reset. The IP dimension is left alone on
 * purpose: resetting it would let an attacker who holds any one valid account
 * wipe the IP counter at will and brute-force the rest from the same address.
 */
export async function clearLoginFailures(identifier: string): Promise<void> {
  try {
    await db.cmsLoginAttempt.deleteMany({ where: { identifier } });
  } catch (err) {
    console.error("[cms] could not clear login failures:", err);
  }
}

/** Best-effort pruning of rows past the retention window. */
export async function pruneLoginAttempts(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - LOGIN_LIMITS.retentionHours * 60 * 60 * 1000);
    await db.cmsLoginAttempt.deleteMany({ where: { created_at: { lt: cutoff } } });
  } catch {
    /* housekeeping only */
  }
}
