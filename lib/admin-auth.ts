import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Shared admin-passcode check for the passcode-gated API routes
 * (careers admin, invoices, legacy leads feed).
 *
 * Two deliberate properties:
 *  1. Constant-time comparison, so a response-timing side channel can't be used
 *     to recover the passcode character by character.
 *  2. Header-only. We do NOT read the passcode from the URL query string — a
 *     passcode in a URL ends up in server/CDN access logs, browser history and
 *     the Referer header. Callers must send it in the `x-admin-passcode` header.
 */

/** Constant-time string equality. False if either side is missing or lengths differ. */
export function passcodesMatch(
  given: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the request carries the correct admin passcode in the header. */
export function hasAdminPasscode(headerValue: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    console.error("[admin-auth] ADMIN_PASSCODE is not configured.");
    return false;
  }
  return passcodesMatch(headerValue, expected);
}
