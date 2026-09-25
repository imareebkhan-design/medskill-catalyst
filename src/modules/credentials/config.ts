/**
 * Credential system configuration — the ONE place for values that are
 * environment- or decision-driven. Nothing else hard-codes a domain, the ID
 * format, the issuer name or delivery behaviour.
 */

export const ISSUER_NAME = "MedSkills Catalyst";

/** Dates on certificates, IDs and the verification page are Indian dates. */
export const CREDENTIAL_TIMEZONE = "Asia/Kolkata";

/**
 * Human-readable certificate ID format (decision 2026-09-25):
 *   MSC-{YEAR}-{PROGRAM_CODE}-{RANDOM}   e.g. MSC-2026-FND-7K4P92
 *
 * RANDOM is drawn uniformly from an alphabet without look-alike characters
 * (no 0/O, 1/I/L, U). 30^6 ≈ 729M combinations per program per year; collisions
 * are caught by the unique index and regenerated. Never sequential.
 */
export const CERTIFICATE_ID_FORMAT = {
  prefix: "MSC",
  template: "{PREFIX}-{YEAR}-{PROGRAM}-{RANDOM}",
  randomLength: 6,
  alphabet: "23456789ABCDEFGHJKMNPQRSTVWXYZ",
  programCodePattern: "[A-Z0-9]{2,10}",
} as const;

/** 128 random bits, base64url → 22 characters. Short enough for a sparse, easily scanned QR. */
export const VERIFICATION_TOKEN_BYTES = 16;

export class CredentialConfigError extends Error {}

function isDeployedProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Canonical public origin used in QR codes, emails and links
 * (decision 2026-09-25: https://medskillscatalyst.com).
 * Required on production; local development falls back to localhost.
 */
export function publicBaseUrl(): string {
  const raw = process.env.CREDENTIAL_PUBLIC_BASE_URL?.trim();
  if (!raw) {
    if (isDeployedProduction()) {
      throw new CredentialConfigError("CREDENTIAL_PUBLIC_BASE_URL must be set on production.");
    }
    return "http://localhost:3000";
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CredentialConfigError("CREDENTIAL_PUBLIC_BASE_URL is not a valid URL.");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    throw new CredentialConfigError("CREDENTIAL_PUBLIC_BASE_URL must use https.");
  }
  if ((url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
    throw new CredentialConfigError("CREDENTIAL_PUBLIC_BASE_URL must be an origin only (no path).");
  }
  if (isDeployedProduction() && local) {
    throw new CredentialConfigError("CREDENTIAL_PUBLIC_BASE_URL cannot be localhost on production.");
  }
  return url.origin;
}

export function verificationUrl(token: string): string {
  return `${publicBaseUrl()}/verify/${token}`;
}

export function verifyPageUrl(): string {
  return `${publicBaseUrl()}/verify`;
}

export function certificateDownloadUrl(token: string): string {
  return `${publicBaseUrl()}/verify/${token}/certificate`;
}

/**
 * Learner email delivery mode.
 *  - off (default): nothing is sent; deliveries are recorded as SUPPRESSED.
 *  - redirect: every credential email goes to CREDENTIAL_EMAIL_REDIRECT_TO
 *    instead of the learner (for staging/QA).
 *  - live: send to learners. Only honoured on the production deployment, so a
 *    preview or local environment can never email a real learner by accident.
 */
export type EmailMode = "off" | "redirect" | "live";

export function emailMode(): { mode: EmailMode; redirectTo?: string; note?: string } {
  const m = process.env.CREDENTIAL_EMAIL_MODE;
  if (m === "live") {
    if (isDeployedProduction()) return { mode: "live" };
    return { mode: "off", note: "CREDENTIAL_EMAIL_MODE=live is ignored outside the production deployment" };
  }
  if (m === "redirect") {
    const to = process.env.CREDENTIAL_EMAIL_REDIRECT_TO?.trim();
    if (to && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { mode: "redirect", redirectTo: to };
    return { mode: "off", note: "CREDENTIAL_EMAIL_REDIRECT_TO is missing or invalid" };
  }
  return { mode: "off" };
}

/** Where certificate PDFs and template assets live. */
export type StorageMode = "supabase" | "local";

export function storageMode(): StorageMode {
  if (process.env.CREDENTIAL_STORAGE === "local") {
    if (process.env.VERCEL) throw new CredentialConfigError("CREDENTIAL_STORAGE=local is not allowed on Vercel.");
    return "local";
  }
  return "supabase";
}

export const CREDENTIAL_BUCKET = "credentials";

/** Templates flagged non-production (e.g. the development template) cannot issue on production. */
export function allowNonProductionTemplates(): boolean {
  return !isDeployedProduction();
}

/** Resend throttle: at most this many resends per credential per hour. */
export const RESEND_LIMIT_PER_HOUR = 5;

/** Public verification: failed lookups tolerated per client per window. */
export const VERIFY_MISS_LIMIT = { limit: 20, windowSeconds: 10 * 60 };
