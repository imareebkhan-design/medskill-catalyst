import { addMonths, indianDate } from "./dates";

export type StoredStatus = "ISSUING" | "VALID" | "REVOKED" | "SUPERSEDED" | "FAILED";
export type PublicStatus = "VALID" | "EXPIRED" | "REVOKED" | "SUPERSEDED";

/**
 * The status a verifier sees. EXPIRED is derived here, at read time, from
 * expires_at — never stored — so no scheduled job is needed and the answer can
 * never be stale (decision 2026-09-25).
 *
 * expires_at is the first day the credential is no longer valid.
 * Returns null for credentials that are not public (ISSUING / FAILED).
 */
export function derivePublicStatus(
  c: { status: StoredStatus; expires_at: Date | null },
  now: Date = new Date(),
): PublicStatus | null {
  switch (c.status) {
    case "REVOKED":
      return "REVOKED";
    case "SUPERSEDED":
      return "SUPERSEDED";
    case "VALID":
      if (c.expires_at && indianDate(now).getTime() >= c.expires_at.getTime()) return "EXPIRED";
      return "VALID";
    default:
      return null;
  }
}

/**
 * expires_at for a program with a validity period, counted from the completion
 * date or the issue date (courses.validity_anchor). null = lifetime.
 */
export function computeExpiresAt(opts: {
  validityMonths: number | null;
  anchor: "COMPLETION" | "ISSUE" | string;
  completionDate: Date;
  issueDate: Date;
}): Date | null {
  if (!opts.validityMonths) return null;
  const base = opts.anchor === "ISSUE" ? opts.issueDate : opts.completionDate;
  return addMonths(base, opts.validityMonths);
}
