/** Errors whose message is safe and useful to show to staff. */
export class CredentialError extends Error {
  constructor(
    message: string,
    public code:
      | "VALIDATION"
      | "NOT_FOUND"
      | "DUPLICATE"
      | "CONFLICT"
      | "NOT_ALLOWED"
      | "RENDER"
      | "CONFIG"
      | "IN_PROGRESS"
      | "RATE_LIMITED" = "VALIDATION",
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/**
 * Name of the unique constraint a Prisma error violated, or null.
 * With the pg driver adapter the constraint surfaces in different places of
 * `meta` depending on version, so search the whole serialized error.
 */
export function uniqueViolation(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { code?: string; meta?: unknown; message?: string; cause?: unknown };
  const isUnique = e.code === "P2002" || /unique constraint/i.test(e.message ?? "") || /23505/.test(JSON.stringify(e.meta ?? {}));
  if (!isUnique) return null;
  let haystack = "";
  try {
    haystack = JSON.stringify(e.meta ?? {}) + " " + (e.message ?? "") + " " + String(e.cause ?? "");
  } catch {
    haystack = e.message ?? "";
  }
  const known = [
    "credentials_dedupe_active_key",
    "credentials_certificate_id_key",
    "credentials_verification_token_key",
    "credentials_idempotency_key_key",
    "credentials_supersedes_id_key",
    "certificate_templates_one_active_per_course",
    "certificate_templates_course_id_version_key",
    "courses_code_key",
    "students_email_key",
    "credential_bulk_rows_job_id_row_number_key",
  ];
  const hit = known.find((k) => haystack.includes(k));
  if (hit) return hit;
  // Field-list form, e.g. target: ["certificate_id"].
  if (haystack.includes("certificate_id")) return "credentials_certificate_id_key";
  if (haystack.includes("verification_token")) return "credentials_verification_token_key";
  if (haystack.includes("idempotency_key")) return "credentials_idempotency_key_key";
  if (haystack.includes("dedupe_key")) return "credentials_dedupe_active_key";
  return "unknown";
}
