/**
 * Which admin authentication the deployment uses.
 *
 *  - "passcode" (default): the legacy shared ADMIN_PASSCODE session. Every
 *    session resolves to one shared "Admin" staff row. Kept as the default so
 *    that merging this code changes nothing in production until the cutover.
 *  - "clerk": per-user Clerk accounts mapped to staff_users rows with roles.
 *
 * The cutover is an env change (ADMIN_AUTH_MODE=clerk) plus a redeploy, and the
 * rollback is the reverse. See docs/credentials/AUTH_ROLLOUT.md.
 *
 * Edge-safe: imported by middleware, so no Node-only imports here.
 */
export type AdminAuthMode = "passcode" | "clerk";

export function adminAuthMode(): AdminAuthMode {
  return process.env.ADMIN_AUTH_MODE === "clerk" ? "clerk" : "passcode";
}

/** Where unauthenticated staff are sent in clerk mode. Outside /admin on purpose. */
export const STAFF_SIGN_IN_PATH = "/staff-sign-in";
