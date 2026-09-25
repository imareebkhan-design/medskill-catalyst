import Link from "next/link";
import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { listLearners } from "@/src/modules/credentials/queries";
import { derivePublicStatus } from "@/src/modules/credentials/status";
import { CredentialStatusBadge, inputCls, PageHeader, secondaryBtn } from "../_ui";

export const dynamic = "force-dynamic";

export default async function LearnersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  if (!can(staff.role, Permission.CredentialsViewPrivate)) {
    return <p className="text-sm text-muted">The learner directory includes contact details and is available to issuers and admins. Use Credentials to search by name or certificate ID.</p>;
  }
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 120) || undefined;
  const page = Math.max(1, Math.min(10_000, Number(sp.page) || 1));
  const { rows, total } = await listLearners(q, page);

  return (
    <div className="space-y-5">
      <PageHeader title="Learners" subtitle={q ? `${total} matching “${q}”` : `${total} learners with credentials`} />
      <form method="GET" className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Name or email" aria-label="Search learners" className={`${inputCls} max-w-sm`} />
        <button className={secondaryBtn}>Search</button>
      </form>
      <div className="overflow-x-auto rounded-msc-lg bg-surface shadow-msc-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Learner</th><th className="px-4 py-3">Credentials</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-brand-navy/5 last:border-0 align-top">
                <td className="px-4 py-3"><span className="font-medium text-brand-navy">{s.full_name}</span><span className="block text-xs text-muted">{s.email}</span></td>
                <td className="px-4 py-3">
                  <ul className="space-y-1.5">
                    {s.credentials.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/credentials/${c.id}`} className="font-mono text-xs text-brand-blue hover:underline">{c.certificate_id}</Link>
                        <span className="text-xs">{c.program_name}</span>
                        <CredentialStatusBadge status={derivePublicStatus(c) ?? c.status} />
                      </li>
                    ))}
                    {s.credentials.length === 0 && <li className="text-xs text-muted">None</li>}
                  </ul>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-muted">No learners found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
