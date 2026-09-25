import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { apiError, assertSameOrigin, readJson } from "@/src/modules/credentials/api";
import { confirmBulkJob, createBulkJob, processBulkChunk } from "@/src/modules/credentials/bulk";
import { CredentialError } from "@/src/modules/credentials/errors";
import { db } from "@/src/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/credentials/bulk
 *  - multipart/form-data { file, courseId, batchId?, sendEmail? } → validate; returns the job and row checks (nothing issued)
 *  - JSON { jobId, action: "confirm" }                               → confirm the job
 *  - JSON { jobId, action: "process", limit? }                       → issue the next chunk (idempotent per row)
 */
export async function POST(req: Request) {
  try {
    const ct = (req.headers.get("content-type") ?? "").toLowerCase();
    if (ct.startsWith("multipart/form-data")) {
      const site = req.headers.get("sec-fetch-site");
      if (site && site !== "same-origin" && site !== "none") throw new AuthError(403, "Cross-site request refused");
      const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new CredentialError("Attach the file as 'file'.", "VALIDATION");
      const job = await createBulkJob(
        {
          bytes: new Uint8Array(await file.arrayBuffer()),
          fileName: file.name,
          courseId: String(form.get("courseId") ?? ""),
          defaultBatchId: (form.get("batchId") as string) || null,
          sendEmail: form.get("sendEmail") !== "false",
        },
        actor,
      );
      const rows = await db.credentialBulkRow.findMany({ where: { job_id: job.id }, orderBy: { row_number: "asc" }, select: { row_number: true, validation: true, messages: true } });
      return NextResponse.json({ ok: true, job: { id: job.id, status: job.status, totalRows: job.total_rows }, rows }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
    }
    assertSameOrigin(req);
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    const body = z.object({ jobId: z.string().uuid(), action: z.enum(["confirm", "process"]), limit: z.number().int().min(1).max(25).optional() }).parse(await readJson(req));
    if (body.action === "confirm") {
      const job = await confirmBulkJob(body.jobId, actor);
      return NextResponse.json({ ok: true, job: { id: job.id, status: job.status } });
    }
    const r = await processBulkChunk(body.jobId, actor, undefined, body.limit ?? 10);
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    return apiError(err);
  }
}
