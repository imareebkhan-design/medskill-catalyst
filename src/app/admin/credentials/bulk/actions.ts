"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, ZodError } from "zod";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { CredentialError } from "@/src/modules/credentials/errors";
import { cancelBulkJob, confirmBulkJob, createBulkJob, processBulkChunk, retryFailedRows } from "@/src/modules/credentials/bulk";

const msg = (err: unknown) => {
  if (err instanceof CredentialError || err instanceof AuthError) return err.message;
  if (err instanceof ZodError) return "Invalid request.";
  console.error("[bulk action]", err);
  return "Something went wrong. Nothing was issued.";
};
const jobId = z.string().uuid();

export async function createBulkJobAction(formData: FormData) {
  let id: string | null = null;
  try {
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new CredentialError("Choose a CSV or XLSX file.", "VALIDATION");
    const job = await createBulkJob(
      {
        bytes: new Uint8Array(await file.arrayBuffer()),
        fileName: file.name,
        courseId: String(formData.get("courseId") ?? ""),
        defaultBatchId: (formData.get("batchId") as string) || null,
        sendEmail: formData.get("sendEmail") === "on",
      },
      actor,
    );
    id = job.id;
  } catch (err) {
    redirect(`/admin/credentials/bulk?error=${encodeURIComponent(msg(err))}`);
  }
  redirect(`/admin/credentials/bulk/${id}`);
}

export async function confirmBulkJobAction(formData: FormData) {
  const id = jobId.parse(formData.get("jobId"));
  try {
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    await confirmBulkJob(id, actor);
  } catch (err) {
    redirect(`/admin/credentials/bulk/${id}?error=${encodeURIComponent(msg(err))}`);
  }
  redirect(`/admin/credentials/bulk/${id}?run=1`);
}

export async function cancelBulkJobAction(formData: FormData) {
  const id = jobId.parse(formData.get("jobId"));
  try {
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    await cancelBulkJob(id, actor);
  } catch (err) {
    redirect(`/admin/credentials/bulk/${id}?error=${encodeURIComponent(msg(err))}`);
  }
  redirect(`/admin/credentials/bulk?ok=discarded`);
}

export async function retryFailedRowsAction(formData: FormData) {
  const id = jobId.parse(formData.get("jobId"));
  try {
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    await retryFailedRows(id, actor);
  } catch (err) {
    redirect(`/admin/credentials/bulk/${id}?error=${encodeURIComponent(msg(err))}`);
  }
  redirect(`/admin/credentials/bulk/${id}?run=1`);
}

/** Called repeatedly by the progress runner; each call issues a small chunk. */
export async function processChunkAction(id: string): Promise<{ ok: true; processed: number; remaining: number } | { ok: false; error: string }> {
  try {
    const actor = await requirePermission(Permission.CredentialsBulkIssue, { individual: true });
    const r = await processBulkChunk(jobId.parse(id), actor, undefined, 5);
    if (r.remaining === 0) revalidatePath(`/admin/credentials/bulk/${id}`);
    return { ok: true, ...r };
  } catch (err) {
    return { ok: false, error: msg(err) };
  }
}
