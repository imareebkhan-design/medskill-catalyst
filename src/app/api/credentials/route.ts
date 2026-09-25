import { NextResponse } from "next/server";
import { Permission } from "@/src/lib/permissions";
import { adminHandler, readJson } from "@/src/modules/credentials/api";
import { issueCredential } from "@/src/modules/credentials/service";
import { CredentialError } from "@/src/modules/credentials/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/credentials — validate and issue one credential (PRD §13).
 * Requires an idempotency key (Idempotency-Key header or body.idempotencyKey);
 * retrying with the same key returns the same credential (200) instead of
 * creating another (201).
 */
export const POST = adminHandler(Permission.CredentialsIssue, { mutating: true }, async (req, _ctx, actor) => {
  const body = await readJson(req);
  const idempotencyKey = req.headers.get("idempotency-key") ?? body.idempotencyKey;
  if (typeof idempotencyKey !== "string") throw new CredentialError("An Idempotency-Key header is required.", "VALIDATION");
  const r = await issueCredential({ ...(body as object), idempotencyKey } as Parameters<typeof issueCredential>[0], actor);
  return NextResponse.json(
    {
      ok: r.credential.status === "VALID",
      created: r.created,
      credential: { id: r.credential.id, certificateId: r.credential.certificate_id, status: r.credential.status, error: r.credential.last_error },
      email: r.email,
    },
    { status: r.created ? 201 : 200 },
  );
});
