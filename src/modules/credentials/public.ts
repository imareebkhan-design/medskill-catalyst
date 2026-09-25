import { ISSUER_NAME, verificationUrl } from "./config";
import { toISODate } from "./dates";
import { derivePublicStatus, type PublicStatus, type StoredStatus } from "./status";

/**
 * The ONLY shape that leaves the server on public surfaces (verification page,
 * /api/verify/*). Built field-by-field from an explicit allowlist — never by
 * spreading a database row — so a new column can never leak by accident.
 *
 * Never included: email, phone, internal UUIDs, student/course/batch ids,
 * revocation reason, actor ids, delivery data, storage paths, hashes.
 */
export type PublicCredential = {
  certificateId: string;
  learnerName: string;
  programName: string;
  completionDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD (India)
  expiresOn: string | null; // YYYY-MM-DD
  status: PublicStatus;
  issuer: string;
  verificationUrl: string;
  /** Present only when the certificate PDF may be downloaded (status VALID or EXPIRED). */
  certificateAvailable: boolean;
};

export type PublicSource = {
  certificate_id: string;
  verification_token: string;
  learner_name: string;
  program_name: string;
  completion_date: Date;
  issued_at: Date;
  expires_at: Date | null;
  status: StoredStatus;
};

/** Fields selected from the database for public lookups — nothing else is read. */
export const PUBLIC_SELECT = {
  certificate_id: true,
  verification_token: true,
  learner_name: true,
  program_name: true,
  completion_date: true,
  issued_at: true,
  expires_at: true,
  status: true,
} as const;

export function toPublicCredential(src: PublicSource, now: Date = new Date()): PublicCredential | null {
  const status = derivePublicStatus(src, now);
  if (!status) return null; // ISSUING / FAILED are not public
  const issueDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(src.issued_at);
  return {
    certificateId: src.certificate_id,
    learnerName: src.learner_name,
    programName: src.program_name,
    completionDate: toISODate(src.completion_date),
    issueDate,
    expiresOn: src.expires_at ? toISODate(src.expires_at) : null,
    status,
    issuer: ISSUER_NAME,
    verificationUrl: verificationUrl(src.verification_token),
    certificateAvailable: status === "VALID" || status === "EXPIRED",
  };
}

export const PUBLIC_FIELD_NAMES: ReadonlyArray<keyof PublicCredential> = [
  "certificateId",
  "learnerName",
  "programName",
  "completionDate",
  "issueDate",
  "expiresOn",
  "status",
  "issuer",
  "verificationUrl",
  "certificateAvailable",
];
