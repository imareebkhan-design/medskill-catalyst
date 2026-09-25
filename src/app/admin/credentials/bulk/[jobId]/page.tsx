import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { db } from "@/src/lib/db";
import type { RowInput, RowMessage } from "@/src/modules/credentials/bulk";
import { cancelBulkJobAction, confirmBulkJobAction, retryFailedRowsAction } from "../actions";
import { Card, Flash, PageHeader, dangerBtn, primaryBtn, secondaryBtn } from "../../_ui";
import { BulkRunner } from "./runner";

export const dynamic = "force-dynamic";

const OUTCOME_TONE: Record<string, string> = {
  SUCCESS: "text-success",
  FAILED: "text-danger",
  SKIPPED: "text-muted",
  DUPLICATE: "text-warning",
  PENDING: "text-sky-700",
};
const VALIDATION_TONE: Record<string, string> = { VALID: "text-success", WARNING: "text-warning", ERROR: "text-danger" };

export default async function BulkJobPage({ params, searchParams }: { params: Promise<{ jobId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  const { jobId } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) notFound();
  const job = await db.credentialBulkJob.findUnique({
    where: { id: jobId },
    include: {
      course: { select: { name: true, code: true } },
      batch: { select: { name: true } },
      template: { select: { version: true, is_production: true } },
      created_by: { select: { name: true } },
      confirmed_by: { select: { name: true } },
      rows: { orderBy: { row_number: "asc" }, include: { credential: { select: { id: true, certificate_id: true, status: true } } } },
    },
  });
  if (!job) notFound();
  const priv = can(staff.role, Permission.CredentialsViewPrivate);
  const canRun = can(staff.role, Permission.CredentialsBulkIssue);
  const jobRows = job.rows;
  const count = (f: (r: (typeof jobRows)[number]) => boolean) => jobRows.filter(f).length;
  const v = { valid: count((r) => r.validation === "VALID"), warn: count((r) => r.validation === "WARNING"), err: count((r) => r.validation === "ERROR") };
  const o = {
    success: count((r) => r.outcome === "SUCCESS"),
    failed: count((r) => r.outcome === "FAILED"),
    dup: count((r) => r.outcome === "DUPLICATE"),
    skipped: count((r) => r.outcome === "SKIPPED"),
    pending: count((r) => r.outcome === "PENDING" && r.validation !== "ERROR"),
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={job.file_name}
        subtitle={`${job.course.name}${job.batch ? ` · default cohort ${job.batch.name}` : ""} · template v${job.template.version}${job.template.is_production ? "" : " (dev)"} · uploaded by ${job.created_by.name}${job.confirmed_by ? ` · confirmed by ${job.confirmed_by.name}` : ""}`}
        actions={<a href={`/api/admin/credentials/bulk/${job.id}/export`} className={secondaryBtn}>Export results (CSV)</a>}
      />
      <Flash error={sp.error} />

      {job.status === "VALIDATED" && (
        <Card className="border border-brand-blue/20">
          <h2 className="font-display text-lg font-semibold text-brand-navy">Preview: nothing has been issued</h2>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-success">{v.valid} ready</span> · <span className="font-semibold text-warning">{v.warn} with warnings</span> ·{" "}
            <span className="font-semibold text-danger">{v.err} with errors (will be skipped)</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Confirming will issue up to {v.valid + v.warn} credential(s){job.send_email ? " and email each learner" : " without emailing learners"}. Rows flagged as duplicates are skipped automatically.
          </p>
          {canRun && (
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={confirmBulkJobAction}><input type="hidden" name="jobId" value={job.id} /><button className={primaryBtn} disabled={v.valid + v.warn === 0}>Confirm and issue {v.valid + v.warn}</button></form>
              <form action={cancelBulkJobAction}><input type="hidden" name="jobId" value={job.id} /><button className={dangerBtn}>Discard upload</button></form>
            </div>
          )}
        </Card>
      )}

      {job.status !== "VALIDATED" && (
        <Card>
          <p className="text-sm">
            Status <strong>{job.status.toLowerCase()}</strong> · <span className="text-success">{o.success} issued</span> · <span className="text-danger">{o.failed} failed</span> ·{" "}
            <span className="text-warning">{o.dup} duplicates</span> · <span className="text-muted">{o.skipped} skipped</span>
            {o.pending > 0 && <> · <span className="text-sky-700">{o.pending} pending</span></>}
          </p>
          {canRun && job.status === "PROCESSING" && o.pending > 0 && <BulkRunner jobId={job.id} autoStart={sp.run === "1"} pending={o.pending} />}
          {canRun && o.failed > 0 && job.status !== "CANCELLED" && (
            <form action={retryFailedRowsAction} className="mt-3"><input type="hidden" name="jobId" value={job.id} /><button className={secondaryBtn}>Retry {o.failed} failed row(s)</button></form>
          )}
        </Card>
      )}

      <div className="overflow-x-auto rounded-msc-lg bg-surface shadow-msc-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-3 py-3">Row</th><th className="px-3 py-3">Learner</th><th className="px-3 py-3">Completed</th><th className="px-3 py-3">Cohort</th><th className="px-3 py-3">Check</th><th className="px-3 py-3">Result</th><th className="px-3 py-3">Notes</th></tr>
          </thead>
          <tbody>
            {job.rows.map((r) => {
              const input = r.input as unknown as RowInput;
              const messages = r.messages as unknown as RowMessage[];
              return (
                <tr key={r.id} className="border-b border-brand-navy/5 align-top last:border-0">
                  <td className="px-3 py-2.5 text-muted">{r.row_number}</td>
                  <td className="px-3 py-2.5"><span className="font-medium">{input.fullName || "—"}</span>{priv && <span className="block text-xs text-muted">{input.email}</span>}</td>
                  <td className="px-3 py-2.5">{input.completionDate || "—"}</td>
                  <td className="px-3 py-2.5 text-xs">{input.cohortName ?? job.batch?.name ?? "—"}</td>
                  <td className={`px-3 py-2.5 text-xs font-semibold ${VALIDATION_TONE[r.validation]}`}>{r.validation.toLowerCase()}</td>
                  <td className={`px-3 py-2.5 text-xs font-semibold ${OUTCOME_TONE[r.outcome]}`}>
                    {job.status === "VALIDATED" ? "—" : r.outcome.toLowerCase()}
                    {r.credential && <Link href={`/admin/credentials/${r.credential.id}`} className="block font-mono font-normal text-brand-blue hover:underline">{r.credential.certificate_id}</Link>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {messages.map((m, i) => <p key={i} className={m.level === "error" ? "text-danger" : "text-warning"}>{m.text}</p>)}
                    {r.error && <p className="text-danger">{r.error}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
