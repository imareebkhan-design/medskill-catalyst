import { NextResponse } from "next/server";
import { z } from "zod";
import { Permission } from "@/src/lib/permissions";
import { adminHandler, readJson } from "@/src/modules/credentials/api";
import { reissueCredential } from "@/src/modules/credentials/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/credentials/:id/reissue — privileged; creates a replacement linked to the prior credential. Idempotency key required. */
export const POST = adminHandler<{ params: Promise<{ id: string }> }>(Permission.CredentialsReissue, { mutating: true }, async (req, { params }, actor) => {
  const id = z.string().uuid().parse((await params).id);
  const body = await readJson(req);
  const idempotencyKey = req.headers.get("idempotency-key") ?? body.idempotencyKey;
  const r = await reissueCredential(id, { ...(body as object), idempotencyKey } as Parameters<typeof reissueCredential>[1], actor);
  return NextResponse.json(
    { ok: r.credential.status === "VALID", created: r.created, credential: { id: r.credential.id, certificateId: r.credential.certificate_id, status: r.credential.status, supersedes: id } },
    { status: r.created ? 201 : 200 },
  );
});
