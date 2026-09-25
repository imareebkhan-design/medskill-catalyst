import { NextResponse } from "next/server";
import { can, Permission } from "@/src/lib/permissions";
import { adminHandler } from "@/src/modules/credentials/api";
import { getCredentialDetail } from "@/src/modules/credentials/queries";
import { derivePublicStatus } from "@/src/modules/credentials/status";
import { verificationUrl } from "@/src/modules/credentials/config";
import { toISODate } from "@/src/modules/credentials/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/credentials/:id — admin detail. Private fields only with credentials.view_private; internal reasons only for audit.view_full. */
export const GET = adminHandler<{ params: Promise<{ id: string }> }>(Permission.CredentialsView, { mutating: false }, async (_req, { params }, actor) => {
  const { id } = await params;
  const c = await getCredentialDetail(id);
  if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  const priv = can(actor.role, Permission.CredentialsViewPrivate);
  const full = can(actor.role, Permission.AuditViewFull);
  return NextResponse.json({
    ok: true,
    credential: {
      id: c.id,
      certificateId: c.certificate_id,
      learnerName: c.learner_name,
      programName: c.program_name,
      cohort: c.batch?.name ?? null,
      completionDate: toISODate(c.completion_date),
      issuedAt: c.issued_at.toISOString(),
      expiresOn: c.expires_at ? toISODate(c.expires_at) : null,
      storedStatus: c.status,
      status: derivePublicStatus(c) ?? c.status,
      verificationUrl: derivePublicStatus(c) ? verificationUrl(c.verification_token) : null,
      templateVersion: c.template.version,
      supersedes: c.supersedes?.certificate_id ?? null,
      supersededBy: c.superseded_by?.certificate_id ?? null,
      ...(priv ? { learnerEmail: c.student.email, deliveries: c.deliveries.map((d) => ({ kind: d.kind, status: d.status, recipient: d.recipient, at: d.created_at })) } : {}),
      ...(full ? { revocationReason: c.revocation_reason, lastError: c.last_error } : {}),
      events: c.events.map((e) => ({ type: e.type, at: e.created_at, actor: e.actor?.name ?? null })),
    },
  });
});
