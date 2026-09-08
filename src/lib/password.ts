/**
 * ============================================================================
 * SERVER / CLI ONLY — NEVER IMPORT THIS INTO A CLIENT COMPONENT.
 * ============================================================================
 *
 * This module has no `import "server-only"` marker, and that omission is
 * deliberate rather than an oversight:
 *
 *   scripts/create-cms-admin.ts must hash the first Super Admin's password
 *   with the EXACT same implementation the login route uses — one hashing
 *   code path, so the two can never drift. That script runs under plain Node
 *   (via tsx), and the `server-only` package throws by design outside a React
 *   Server Component environment. Keeping the marker would therefore make it
 *   impossible for the CLI to share this code, forcing a duplicate
 *   implementation — a far worse outcome than dropping the marker.
 *
 * Client use is still structurally impossible: this module imports
 * `node:crypto`, which fails the browser build outright rather than shipping
 * anything to a user. The marker would be belt-and-braces, not the only guard.
 *
 * Consumers: src/lib/cms-auth.ts (server) and scripts/create-cms-admin.ts
 * (CLI). If you need password strength rules in the browser, import
 * `passwordProblem` semantics by re-stating them in the form component —
 * do NOT import this file, and do NOT copy the hashing logic anywhere.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing for CMS accounts.
 *
 * scrypt is used deliberately over bcrypt/argon2: it ships inside Node's own
 * crypto module, so there is no native addon to compile. That matters here
 * because the app builds on two hosts (Vercel and Firebase App Hosting) and a
 * native dependency is the classic way to break one of them.
 *
 * Hashes are self-describing — the cost parameters travel with the hash — so
 * they can be raised later without invalidating existing passwords.
 *
 *   scrypt$16384$8$1$<salt-b64>$<key-b64>
 */

const PARAMS = { N: 16_384, r: 8, p: 1 } as const;
const KEYLEN = 64;
const SALT_BYTES = 16;
// N*r*128 ≈ 16 MiB is the real requirement; Node's 32 MiB default leaves no
// headroom, so ask for 64 MiB explicitly rather than relying on the default.
const MAXMEM = 64 * 1024 * 1024;

/** Minimum password length accepted anywhere in the system. */
export const MIN_PASSWORD_LENGTH = 12;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) return "Password must be 200 characters or fewer.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { ...PARAMS, maxmem: MAXMEM });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

/**
 * Constant-time verification. Returns false for malformed hashes rather than
 * throwing, so a corrupt row can never crash the login route.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // Refuse absurd parameters from a tampered row — they would otherwise let a
  // poisoned hash exhaust memory or CPU on every login attempt.
  if (N < 1024 || N > 1_048_576 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64");
    expected = Buffer.from(parts[5], "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N,
      r,
      p,
      maxmem: MAXMEM,
    });
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * A pre-computed hash of a random value, used to burn the same CPU on a
 * login attempt for an unknown email as for a known one. Without this, response
 * time alone reveals which addresses have accounts.
 */
let decoyHash: string | null = null;

export async function equivalentWorkForUnknownUser(password: string): Promise<false> {
  decoyHash ??= await hashPassword(randomBytes(24).toString("hex"));
  await verifyPassword(password, decoyHash);
  return false;
}
