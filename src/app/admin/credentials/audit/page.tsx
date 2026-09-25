import Link from "next/link";
import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { db } from "@/src/lib/db";
import { auditFiltersSchema, listAuditEvents } from "@/src/modules/credentials/queries";
import { EVENT_LABEL, fmtDateTime, inputCls, PageHeader, secondaryBtn } from "../_ui";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  const full = can(staff.role, Permission.AuditViewFull);
  const sp = await searchParams;
  const pick = (k: string) => (sp[k] ? sp[k] : undefined);
  const parsed = auditFiltersSchema.safeParse({ type: pick("type"), actorId: pick("actorId"), certificateId: pick("certificateId"), from: pick("from"), to: pick("to"), page: pick("page") });
  const f = parsed.success ? parsed.data : { page: 1 };
  const [{ rows, total, pages }, actors] = await Promise.all([
    listAuditEvents(f),
    db.staffUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Audit" subtitle={`${total.toLocaleString("en-IN")} credential events · append-only`} />
      <form method="GET" className="grid gap-2 rounded-msc-lg bg-surface p-4 shadow-msc-sm sm:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
        <input name="certificateId" defaultValue={f.certificateId ?? ""} placeholder="Certificate ID" aria-label="Certificate ID" className={`${inputCls} font-mono`} />
        <select name="type" defaultValue={f.type ?? ""} aria-label="Action" className={inputCls}>
          <option value="">Any action</option>
          {Object.entries(EVENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="actorId" defaultValue={f.actorId ?? ""} aria-label="Staff member" className={inputCls}>
          <option value="">Anyone</option>
          {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={f.from ?? ""} aria-label="From" className={inputCls} />
        <input type="date" name="to" defaultValue={f.to ?? ""} aria-label="To" className={inputCls} />
        <button className={secondaryBtn}>Filter</button>
      </form>
      <div className="overflow-x-auto rounded-msc-lg bg-surface shadow-msc-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Credential</th><th className="px-4 py-3">By</th><th className="px-4 py-3">Details</th></tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const meta = Object.entries(e.metadata as Record<string, unknown>).filter(([k]) => full || (k !== "reason" && k !== "error"));
              return (
                <tr key={e.id} className="border-b border-brand-navy/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{fmtDateTime(e.created_at)}</td>
                  <td className="px-4 py-2.5 font-medium">{EVENT_LABEL[e.type] ?? e.type}</td>
                  <td className="px-4 py-2.5"><Link href={`/admin/credentials/${e.credential.id}`} className="font-mono text-xs text-brand-blue hover:underline">{e.credential.certificate_id}</Link></td>
                  <td className="px-4 py-2.5">{e.actor?.name ?? "System"}</td>
                  <td className="max-w-[360px] break-words px-4 py-2.5 text-xs text-muted">{meta.map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No events.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && <p className="text-sm text-muted">Page {f.page} of {pages}</p>}
      {!full && <p className="text-xs text-muted">Internal reasons and error details are visible to admins only.</p>}
    </div>
  );
}
