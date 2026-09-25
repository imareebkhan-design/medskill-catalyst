import { NextResponse } from "next/server";
import { z } from "zod";
import { Permission } from "@/src/lib/permissions";
import { adminHandler } from "@/src/modules/credentials/api";
import { resendCredential } from "@/src/modules/credentials/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/credentials/:id/resend — resend delivery; never creates a credential. */
export const POST = adminHandler<{ params: Promise<{ id: string }> }>(Permission.CredentialsResend, { mutating: true }, async (_req, { params }, actor) => {
  const id = z.string().uuid().parse((await params).id);
  const email = await resendCredential(id, actor);
  return NextResponse.json({ ok: email.status !== "FAILED", email });
});
