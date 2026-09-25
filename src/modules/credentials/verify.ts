import "server-only";
import { db } from "@/src/lib/db";
import { checkAdminAuthRateLimit, recordAdminAuthFailure } from "@/src/lib/rate-limit";
import { VERIFY_MISS_LIMIT } from "./config";
import { isWellFormedCertificateId, isWellFormedToken, normalizeCertificateId } from "./identifiers";
import { PUBLIC_SELECT, toPublicCredential, type PublicCredential } from "./public";

/**
 * Public verification lookups.
 *
 * Abuse controls:
 *  - Exact match only (normalized certificate ID or token); no name/email search.
 *  - Malformed input is rejected before touching the database.
 *  - Misses are counted per client with the shared limiter (in-process +
 *    Postgres). Legitimate verifiers hit; enumeration produces misses and is
 *    refused after VERIFY_MISS_LIMIT misses per window. Hits cost nothing.
 *  - Not-found, not-yet-issued and failed credentials all produce the same
 *    neutral "not found" answer.
 */

export type VerifyOutcome =
  | { kind: "found"; credential: PublicCredential; token: string }
  | { kind: "not_found" }
  | { kind: "rate_limited"; retryAfterSeconds: number };

async function miss(clientKey: string): Promise<VerifyOutcome> {
  const verdict = await recordAdminAuthFailure(clientKey, VERIFY_MISS_LIMIT);
  if (verdict.blocked) return { kind: "rate_limited", retryAfterSeconds: verdict.retryAfterSeconds };
  return { kind: "not_found" };
}

export async function verifyByToken(token: string, clientKey: string): Promise<VerifyOutcome> {
  const limit = checkAdminAuthRateLimit(clientKey, VERIFY_MISS_LIMIT);
  if (limit.blocked) return { kind: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };
  if (!isWellFormedToken(token)) return miss(clientKey);
  const row = await db.credential.findUnique({ where: { verification_token: token }, select: PUBLIC_SELECT });
  const pub = row ? toPublicCredential(row) : null;
  if (!pub || !row) return miss(clientKey);
  return { kind: "found", credential: pub, token: row.verification_token };
}

export async function verifyByCertificateId(input: string, clientKey: string): Promise<VerifyOutcome> {
  const limit = checkAdminAuthRateLimit(clientKey, VERIFY_MISS_LIMIT);
  if (limit.blocked) return { kind: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };
  const id = normalizeCertificateId(input);
  if (!isWellFormedCertificateId(id)) return miss(clientKey);
  const row = await db.credential.findUnique({ where: { certificate_id: id }, select: PUBLIC_SELECT });
  const pub = row ? toPublicCredential(row) : null;
  if (!pub || !row) return miss(clientKey);
  return { kind: "found", credential: pub, token: row.verification_token };
}

/** PDF for the public download link: only VALID (incl. derived EXPIRED) credentials. */
export async function publicCertificatePdf(token: string, clientKey: string) {
  const limit = checkAdminAuthRateLimit(clientKey, VERIFY_MISS_LIMIT);
  if (limit.blocked) return { kind: "rate_limited" as const, retryAfterSeconds: limit.retryAfterSeconds };
  if (!isWellFormedToken(token)) {
    await recordAdminAuthFailure(clientKey, VERIFY_MISS_LIMIT);
    return { kind: "not_found" as const };
  }
  const row = await db.credential.findUnique({
    where: { verification_token: token },
    select: { ...PUBLIC_SELECT, pdf_path: true },
  });
  const pub = row ? toPublicCredential(row) : null;
  if (!row || !pub || !pub.certificateAvailable || !row.pdf_path) {
    await recordAdminAuthFailure(clientKey, VERIFY_MISS_LIMIT);
    return { kind: "not_found" as const };
  }
  return { kind: "found" as const, pdfPath: row.pdf_path, certificateId: row.certificate_id };
}

export const VERIFY_RATE_LIMIT_SURFACE = "verify";
