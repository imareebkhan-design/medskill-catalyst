import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/src/lib/db";
import { CmsRole, CmsUserStatus } from "@/src/generated/prisma/enums";
import {
  can,
  roleAtLeast,
  type Capability,
} from "@/src/lib/cms-roles";
import {
  equivalentWorkForUnknownUser,
  verifyPassword,
} from "@/src/lib/password";
import {
  clearLoginFailures,
  isLoginThrottled,
  LOGIN_LIMITS,
  pruneLoginAttempts,
  recordLoginFailure,
} from "@/src/lib/cms-rate-limit";

/**
 * CMS authentication — per-user credentials with server-side sessions.
 *
 * Deliberately separate from src/lib/auth.ts, which gates the CRM with a
 * single shared passcode. The two never share a cookie, a table, or a guard:
 * a CRM passcode grants nothing in the CMS, and vice versa.
 *
 * Sessions are DB-backed rather than stateless so that disabling a user (or
 * their signing out) revokes access immediately, instead of waiting for a
 * token to expire.
 */

export const CMS_COOKIE = "msc_cms";
const SESSION_HOURS = 12;
const TOKEN_BYTES = 32;

export type CmsSessionUser = {
  id: string;
  email: string;
  full_name: string;
  role: CmsRole;
};

export class CmsAuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "CmsAuthError";
  }
}

/**
 * Only the SHA-256 of the session token is stored. A dump of cms_sessions
 * therefore cannot be replayed as a login. SHA-256 (not scrypt) is correct
 * here: the token is 256 bits of CSPRNG output, so there is no low-entropy
 * secret for an attacker to brute-force.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── Session lifecycle ────────────────────────────────────────────────

/** Issue a session for an already-authenticated user and set the cookie. */
export async function createSession(userId: string, userAgent?: string | null): Promise<void> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await db.cmsSession.create({
    data: {
      token_hash: hashToken(token),
      user_id: userId,
      expires_at: expiresAt,
      user_agent: userAgent?.slice(0, 500) ?? null,
    },
  });

  (await cookies()).set(CMS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Sign out: delete the session row, then clear the cookie. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CMS_COOKIE)?.value;
  if (token) {
    // deleteMany (not delete) so an already-removed session is not an error.
    await db.cmsSession.deleteMany({ where: { token_hash: hashToken(token) } });
  }
  jar.delete(CMS_COOKIE);
}

/** Best-effort removal of expired rows. Never allowed to fail a request. */
async function pruneExpiredSessions(): Promise<void> {
  try {
    await db.cmsSession.deleteMany({ where: { expires_at: { lt: new Date() } } });
  } catch {
    /* housekeeping only */
  }
}

// ── Reading the current user ─────────────────────────────────────────

/**
 * Resolve the signed-in CMS user, or null.
 *
 * Every load re-reads the user row, so a role change or a deactivation takes
 * effect on the very next request rather than at session expiry.
 */
export async function getCmsUser(): Promise<CmsSessionUser | null> {
  const token = (await cookies()).get(CMS_COOKIE)?.value;
  if (!token) return null;

  let session: {
    expires_at: Date;
    user: {
      id: string;
      email: string;
      full_name: string;
      role: CmsRole;
      status: CmsUserStatus;
    };
  } | null;

  try {
    session = await db.cmsSession.findUnique({
      where: { token_hash: hashToken(token) },
      select: {
        expires_at: true,
        user: {
          select: { id: true, email: true, full_name: true, role: true, status: true },
        },
      },
    });
  } catch (err) {
    // FAIL CLOSED. Any lookup failure is treated as "not signed in" — never as
    // a session. This catch exists for one concrete case: an environment whose
    // CMS tables have not been created yet (Prisma P2021). Without it, a request
    // merely CARRYING an msc_cms cookie throws, and every /cms route — including
    // the sign-in page itself — returns a 500 with a database error behind it.
    //
    // Returning null instead sends the visitor to the sign-in screen, which is
    // both the safe outcome and the honest one. The error is logged server-side
    // so a real outage is still visible to operators.
    //
    // The invariant this must never break: this catch returns null. It must not
    // return a user, and it must not fall through. tests/cms-fail-closed.test.ts
    // enforces that textually.
    console.error("[cms] session lookup failed; treating as signed out:", err);
    return null;
  }

  if (!session) return null;
  if (session.expires_at < new Date()) return null;
  if (session.user.status !== CmsUserStatus.ACTIVE) return null;

  const { id, email, full_name, role } = session.user;
  return { id, email, full_name, role };
}

// ── Guards ───────────────────────────────────────────────────────────

/**
 * The enforcement gate. Every CMS page, server action and route handler must
 * call this (or requireCapability) before touching data.
 *
 * Layouts are NOT a reliable boundary in the App Router — a page can render
 * without its parent layout re-running — so this is called per page, matching
 * the convention already used by the CRM admin.
 */
export async function requireCmsUser(minRole?: CmsRole): Promise<CmsSessionUser> {
  const user = await getCmsUser();
  if (!user) throw new CmsAuthError(401, "Please sign in to continue.");
  if (minRole && !roleAtLeast(user.role, minRole)) {
    throw new CmsAuthError(403, "You do not have permission to do that.");
  }
  return user;
}

/** Guard by named capability — preferred over passing a raw minimum role. */
export async function requireCapability(capability: Capability): Promise<CmsSessionUser> {
  const user = await requireCmsUser();
  if (!can(user, capability)) {
    throw new CmsAuthError(403, "You do not have permission to do that.");
  }
  return user;
}

// ── Login ────────────────────────────────────────────────────────────

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

/** Shown for every failure mode, so the form never reveals which emails exist. */
const GENERIC_FAILURE = "That email and password combination is not recognised.";

/**
 * Shown when the attempt is throttled. This message differs from
 * GENERIC_FAILURE, which is safe: it is driven purely by the number of recent
 * failures against the submitted string, and is returned identically whether
 * or not that address has an account. It therefore leaks nothing about which
 * emails exist — only that this address has been tried repeatedly, which the
 * attacker already knows because they caused it.
 */
const THROTTLED = `Too many sign-in attempts. Please wait ${LOGIN_LIMITS.windowMinutes} minutes and try again.`;

/**
 * Record a failed attempt, and raise a single audit entry at the moment the
 * threshold is crossed.
 *
 * Logging every refusal would let an attacker flood audit_logs; logging only
 * on the crossing keeps the signal ("this address is being guessed at") while
 * bounding the volume to roughly one row per window.
 */
async function noteFailure(email: string, ip: string | null): Promise<void> {
  await recordLoginFailure(email, ip);
  try {
    const since = new Date(Date.now() - LOGIN_LIMITS.windowMinutes * 60 * 1000);
    const failures = await db.cmsLoginAttempt.count({
      where: { identifier: email, created_at: { gte: since } },
    });
    if (failures === LOGIN_LIMITS.maxPerIdentifier) {
      await db.auditLog.create({
        data: {
          action: "cms.login.throttled",
          entity_type: "cms_auth",
          entity_id: email.slice(0, 320),
          entity_name: email.slice(0, 320),
          after: { failures, ip, window_minutes: LOGIN_LIMITS.windowMinutes },
        },
      });
    }
  } catch (err) {
    // Auditing must never block or break the login response.
    console.error("[cms] could not record a login-throttle audit entry:", err);
  }
}

/**
 * Verify credentials against the admin whitelist.
 *
 * Authorisation is a database lookup, never a domain-suffix check: an
 * @medskillscatalyst.com address with no ACTIVE cms_users row gets nothing.
 */
export async function attemptLogin(
  emailRaw: string,
  password: string,
  userAgent?: string | null,
  ip: string | null = null,
): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) return { ok: false, message: GENERIC_FAILURE };

  // Refuse before any password hashing, so a flood costs the server nothing.
  if (await isLoginThrottled(email, ip)) {
    return { ok: false, message: THROTTLED };
  }

  const user = await db.cmsUser.findUnique({
    where: { email },
    select: { id: true, password_hash: true, status: true },
  });

  // Unknown email: still burn equivalent CPU, so response time does not
  // disclose whether an account exists.
  if (!user) {
    await equivalentWorkForUnknownUser(password);
    await noteFailure(email, ip);
    return { ok: false, message: GENERIC_FAILURE };
  }

  const valid = await verifyPassword(password, user.password_hash);
  // A disabled account is rejected with the same message as a bad password —
  // but only after the hash check, so timing stays uniform.
  if (!valid || user.status !== CmsUserStatus.ACTIVE) {
    await noteFailure(email, ip);
    return { ok: false, message: GENERIC_FAILURE };
  }

  // Success clears the identifier's failures so a user who mistyped a few
  // times is not still throttled on their next visit.
  await clearLoginFailures(email);
  await pruneLoginAttempts();
  await pruneExpiredSessions();
  await createSession(user.id, userAgent);
  await db.cmsUser.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  return { ok: true, userId: user.id };
}
