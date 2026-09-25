import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { auth as clerkAuth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { db } from "@/src/lib/db";
import type { StaffUser } from "@/src/generated/prisma/client";
import { StaffRole } from "@/src/generated/prisma/enums";
import { adminAuthMode } from "@/src/lib/auth-mode";
import { can, type Permission } from "@/src/lib/permissions";

// Role hierarchy for the pre-existing CRM pages: every role implies the ones
// below it. The credential system does not use ranks — see src/lib/permissions.ts.
const ROLE_RANK: Record<StaffRole, number> = {
  [StaffRole.ADMIN]: 4,
  [StaffRole.ACCOUNTS]: 3,
  [StaffRole.COUNSELOR]: 2,
  [StaffRole.VIEWER]: 1,
  // Credential issuers get no extra CRM (leads/payments) rights.
  [StaffRole.ISSUER]: 1,
};

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

// ── Passcode session (ADMIN_AUTH_MODE=passcode, the default) ───────
// The CRM is gated by a single shared passcode (ADMIN_PASSCODE). A valid
// passcode sets an httpOnly cookie whose value is an HMAC of the passcode, so
// the cookie can't be forged without knowing the secret.

export const ADMIN_COOKIE = "msc_admin";

/** clerk_user_id of the single row that backs every passcode session. */
export const SHARED_PASSCODE_IDENTITY = "passcode-admin";

/** Prefix for staff rows created by an admin before the person first signs in. */
export const PENDING_IDENTITY_PREFIX = "pending:";

function passcodeSecret(): string | null {
  const p = process.env.ADMIN_PASSCODE;
  return p && p.length > 0 ? p : null;
}

/**
 * True when this deployment actually has a passcode to check against.
 * Worth asking separately: with ADMIN_PASSCODE unset, isValidPasscode() is
 * false for *every* input, so "wrong passcode" is a misleading thing to report.
 */
export function isPasscodeConfigured(): boolean {
  return passcodeSecret() !== null;
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

async function hasValidPasscodeSession(): Promise<boolean> {
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
    where: { clerk_user_id: SHARED_PASSCODE_IDENTITY },
    create: {
      clerk_user_id: SHARED_PASSCODE_IDENTITY,
      name: "Admin",
      email: "admin@medskillscatalyst.com",
      role: StaffRole.ADMIN,
    },
    update: {},
  });
}

// ── Clerk session (ADMIN_AUTH_MODE=clerk) ──────────────────────────

function bootstrapAdminEmails(): Set<string> {
  return new Set(
    (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Resolve the signed-in Clerk user to a staff_users row.
 *
 * Mapping rules (docs/credentials/AUTH_ROLLOUT.md):
 *  1. A row whose clerk_user_id is the Clerk user id → that row.
 *  2. Otherwise a row an admin provisioned as "pending:<email>" whose email is
 *     one of the user's VERIFIED Clerk emails → bound to this Clerk id on first
 *     sign-in (one-time; the binding is then permanent).
 *  3. Otherwise, if a verified email is in BOOTSTRAP_ADMIN_EMAILS and no staff
 *     row uses that email yet → an ADMIN row is created. This is how the first
 *     admin gets in, and the break-glass path if every admin is lost.
 *  4. Otherwise → 403. Signing up with Clerk grants nothing by itself.
 *
 * Unverified emails are never used for matching: whoever controls a Clerk
 * account with an unverified address must not inherit that address's access.
 */
async function clerkStaff(): Promise<StaffUser> {
  const { userId } = await clerkAuth();
  if (!userId) throw new AuthError(401, "Sign in to continue");

  const existing = await db.staffUser.findUnique({ where: { clerk_user_id: userId } });
  if (existing) return existing;

  const user = await clerkCurrentUser();
  const verified = (user?.emailAddresses ?? [])
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.trim().toLowerCase());
  if (verified.length === 0) {
    throw new AuthError(403, "Your account has no verified email address.");
  }
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || verified[0];

  for (const email of verified) {
    const bound = await db.staffUser.updateMany({
      where: { clerk_user_id: `${PENDING_IDENTITY_PREFIX}${email}`, email },
      data: { clerk_user_id: userId },
    });
    if (bound.count === 1) {
      const staff = await db.staffUser.findUniqueOrThrow({ where: { clerk_user_id: userId } });
      await db.auditLog.create({
        data: {
          actor_id: staff.id,
          action: "STAFF_IDENTITY_LINKED",
          entity_type: "staff_user",
          entity_id: staff.id,
          after: { email, role: staff.role },
        },
      });
      return staff;
    }
  }

  const bootstrap = bootstrapAdminEmails();
  const bootstrapEmail = verified.find((e) => bootstrap.has(e));
  if (bootstrapEmail) {
    const taken = await db.staffUser.findUnique({ where: { email: bootstrapEmail } });
    if (!taken) {
      const staff = await db.staffUser.create({
        data: {
          clerk_user_id: userId,
          email: bootstrapEmail,
          name: displayName,
          role: StaffRole.ADMIN,
        },
      });
      await db.auditLog.create({
        data: {
          actor_id: staff.id,
          action: "STAFF_BOOTSTRAP_ADMIN",
          entity_type: "staff_user",
          entity_id: staff.id,
          after: { email: bootstrapEmail },
        },
      });
      return staff;
    }
    // The address already belongs to a different identity. Refuse rather than
    // re-point it: re-binding would let a second Clerk account take over the row.
    console.error("[auth] bootstrap email already bound to another staff identity");
  }

  throw new AuthError(403, "Your account is not authorized for the MedSkills admin. Ask an admin to add you.");
}

// ── Local development impersonation (ADMIN_AUTH_MODE=dev) ──────────
// Lets a developer act as any staff row to exercise role checks without Clerk
// keys. Refused on Vercel and unless explicitly enabled; see devAuthAllowed().

export const DEV_STAFF_COOKIE = "msc_dev_staff";

export function devAuthAllowed(): boolean {
  return (
    process.env.ADMIN_AUTH_MODE === "dev" &&
    process.env.DEV_AUTH_ENABLE === "local-only" &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV
  );
}

async function devStaff(): Promise<StaffUser> {
  if (!devAuthAllowed()) throw new AuthError(401, "Dev auth is not enabled");
  const id = (await cookies()).get(DEV_STAFF_COOKIE)?.value;
  if (!id) throw new AuthError(401, "Pick a staff identity to continue");
  const staff = await db.staffUser.findUnique({ where: { id } });
  if (!staff) throw new AuthError(401, "Unknown staff identity");
  return staff;
}

// ── Public API ─────────────────────────────────────────────────────

async function resolveStaff(): Promise<StaffUser> {
  if (process.env.ADMIN_AUTH_MODE === "dev") return devStaff();
  if (adminAuthMode() === "clerk") return clerkStaff();
  if (!(await hasValidPasscodeSession())) throw new AuthError(401, "Enter the admin passcode to continue");
  return passcodeStaff();
}

/**
 * The real enforcement gate for the pre-existing CRM pages.
 * Throws AuthError(401) when unauthenticated, 403 when the role is too low or
 * the staff account is deactivated.
 */
export async function requireStaff(minRole: StaffRole = StaffRole.VIEWER): Promise<StaffUser> {
  const staff = await resolveStaff();
  if (!staff.is_active) throw new AuthError(403, "This staff account is deactivated");
  if (ROLE_RANK[staff.role] < ROLE_RANK[minRole]) {
    throw new AuthError(403, `Requires ${minRole} role`);
  }
  return staff;
}

/** True for the one shared row that every passcode session resolves to. */
export function isSharedIdentity(staff: Pick<StaffUser, "clerk_user_id">): boolean {
  return staff.clerk_user_id === SHARED_PASSCODE_IDENTITY;
}

/**
 * Permission gate for the credential system.
 *
 * `individual: true` (the default for anything that changes state) refuses
 * the shared passcode identity: credential issuance, revocation, reissue and
 * template changes must be attributable to a real person (decision 2026-09-25).
 */
export async function requirePermission(
  permission: Permission,
  opts: { individual?: boolean } = {},
): Promise<StaffUser> {
  const staff = await resolveStaff();
  if (!staff.is_active) throw new AuthError(403, "This staff account is deactivated");
  if (!can(staff.role, permission)) throw new AuthError(403, "You do not have permission to do this");
  if (opts.individual && isSharedIdentity(staff)) {
    throw new AuthError(
      403,
      "This action needs an individual staff login. The shared admin passcode cannot issue, revoke or reissue credentials.",
    );
  }
  return staff;
}

/**
 * Why the gate refused. "unauthenticated" is the ordinary case — no session, or
 * a bad passcode. "forbidden" is a signed-in person without access (clerk mode).
 * "backend" means authentication was fine and something behind it failed
 * (typically the database call). Keeping these apart matters: collapsing them
 * sends a correct login back to the login form and hides the real outage.
 */
export type StaffGate =
  | { ok: true; staff: StaffUser }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "forbidden"; message: string }
  | { ok: false; reason: "backend" };

export async function staffGate(): Promise<StaffGate> {
  try {
    return { ok: true, staff: await requireStaff() };
  } catch (err) {
    if (err instanceof AuthError) {
      return err.status === 403
        ? { ok: false, reason: "forbidden", message: err.message }
        : { ok: false, reason: "unauthenticated" };
    }
    // Never surface this to the browser: a Prisma/pg failure can carry the
    // connection string. Log it server-side and report only the category.
    console.error("[auth] staff gate failed behind a valid session:", err);
    return { ok: false, reason: "backend" };
  }
}

/** Non-throwing variant for pages that render a friendly "sign in" state. */
export async function getStaff(): Promise<StaffUser | null> {
  const gate = await staffGate();
  return gate.ok ? gate.staff : null;
}
