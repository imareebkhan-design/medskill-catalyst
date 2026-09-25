import Link from "next/link";
import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { db } from "@/src/lib/db";
import { createCohortAction } from "../actions";
import { Card, Flash, fmtDate, inputCls, PageHeader, primaryBtn } from "../_ui";

export const dynamic = "force-dynamic";

export default async function CohortsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  const manage = can(staff.role, Permission.CohortsManage);
  const sp = await searchParams;
  const programs = await db.course.findMany({
    orderBy: { name: "asc" },
    include: { batches: { orderBy: { created_at: "desc" }, include: { _count: { select: { credentials: true, enrollments: true } } } } },
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Cohorts" subtitle="Cohorts are the existing course batches used for enrollment." />
      <Flash error={sp.error} ok={sp.ok ? "Cohort created." : undefined} />
      {manage && (
        <Card>
          <form action={createCohortAction} className="grid gap-3 sm:grid-cols-[1.2fr_1.4fr_150px_150px_auto]">
            <select name="courseId" required aria-label="Program" className={inputCls}>
              <option value="">Program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="name" required maxLength={120} placeholder="Cohort name, e.g. Cohort 2: January 2027" aria-label="Cohort name" className={inputCls} />
            <input name="startDate" type="date" aria-label="Start date" className={inputCls} />
            <input name="endDate" type="date" aria-label="End date" className={inputCls} />
            <button className={primaryBtn}>Add cohort</button>
          </form>
        </Card>
      )}
      {programs.map((p) => (
        <Card key={p.id}>
          <h2 className="font-display text-lg font-semibold text-brand-navy">{p.name}</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="py-2">Cohort</th><th className="py-2">Dates</th><th className="py-2 text-right">Enrolled</th><th className="py-2 text-right">Credentials</th></tr>
            </thead>
            <tbody>
              {p.batches.map((b) => (
                <tr key={b.id} className="border-t border-brand-navy/5">
                  <td className="py-2"><Link className="text-brand-blue hover:underline" href={`/admin/credentials/list?batchId=${b.id}`}>{b.name}</Link></td>
                  <td className="py-2 text-muted">{fmtDate(b.start_date)} – {fmtDate(b.end_date)}</td>
                  <td className="py-2 text-right">{b._count.enrollments}</td>
                  <td className="py-2 text-right">{b._count.credentials}</td>
                </tr>
              ))}
              {p.batches.length === 0 && <tr><td colSpan={4} className="py-3 text-muted">No cohorts.</td></tr>}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
