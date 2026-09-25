import { NextResponse } from "next/server";
import { z } from "zod";
import { Permission } from "@/src/lib/permissions";
import { adminHandler, readJson } from "@/src/modules/credentials/api";
import { revokeCredential } from "@/src/modules/credentials/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/credentials/:id/revoke { reason } — privileged; status change + audit event. */
export const POST = adminHandler<{ params: Promise<{ id: string }> }>(Permission.CredentialsRevoke, { mutating: true }, async (req, { params }, actor) => {
  const id = z.string().uuid().parse((await params).id);
  const body = await readJson(req);
  const c = await revokeCredential(id, String(body.reason ?? ""), actor);
  return NextResponse.json({ ok: true, credential: { id: c.id, certificateId: c.certificate_id, status: c.status } });
});
