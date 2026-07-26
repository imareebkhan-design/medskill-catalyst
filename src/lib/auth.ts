import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/src/lib/db";
import type { StaffUser } from "@/src/generated/prisma/client";
import { StaffRole } from "@/src/generated/prisma/enums";

// Role hierarchy: every role implies the ones below it.
const ROLE_RANK: Record<StaffRole, number> = {
  [StaffRole.ADMIN]: 4,
  [StaffRole.ACCOUNTS]: 3,
  [StaffRole.COUNSELOR]: 2,
  [StaffRole.VIEWER]: 1,
};

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

// ── Passcode session ───────────────────────────────────────────────
// The CRM is gated by a single shared passcode (ADMIN_PASSCODE) — the same
// mechanism the deployed careers admin uses. A valid passcode sets an
// httpOnly cookie whose value is an HMAC of the passcode, so the cookie can't
// be forged without knowing the secret. No third-party auth provider.

export const ADMIN_COOKIE = "msc_admin";

function passcodeSecret(): string | null {
  const p = process.env.ADMIN_PASSCODE;
  return p && p.length > 0 ? p : null;
}

/** The value we store in (and expect from) the session cookie. */
export function cookieTokenFor(passcode: string): string {
  return createHmac("sha256", passcode).update("msc-admin-v1").digest("hex");
}

/** True when `given` matches the expected passcode. */
export function isValidPasscode(given: string): boolean {
  const secret = passcodeSecret();
  if (!secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function hasValidSession(): Promise<boolean> {
  const secret = passcodeSecret();
  if (!secret) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = cookieTokenFor(secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * A single StaffUser row backs every passcode session, so activity/audit rows
 * still have a valid actor_id foreign key. Created on first authenticated use.
 */
async function passcodeStaff(): Promise<StaffUser> {
  return db.staffUser.upsert({
    where: { clerk_user_id: "passcode-admin" },
    create: {
      clerk_user_id: "passcode-admin",
      name: "Admin",
      email: "admin@medskillscatalyst.com",
      role: StaffRole.ADMIN,
    },
    update: {},
  });
}

/**
 * The real enforcement gate. Every admin page/API must call this.
 * Throws AuthError(401) when the passcode session is missing/invalid.
 */
export async function requireStaff(minRole: StaffRole = StaffRole.VIEWER): Promise<StaffUser> {
  if (!(await hasValidSession())) throw new AuthError(401, "Enter the admin passcode to continue");
  const staff = await passcodeStaff();
  if (ROLE_RANK[staff.role] < ROLE_RANK[minRole]) {
    throw new AuthError(403, `Requires ${minRole} role`);
  }
  return staff;
}

/** Non-throwing variant for pages that render a friendly "sign in" state. */
export async function getStaff(): Promise<StaffUser | null> {
  try {
    return await requireStaff();
  } catch {
    return null;
  }
}
