import { getStaff } from "@/src/lib/auth";
import { can, Permission, ROLE_LABELS } from "@/src/lib/permissions";
import { StaffRole } from "@/src/generated/prisma/enums";
import { isPending, listStaff } from "@/src/modules/staff/service";
import { addStaffAction, updateStaffAction } from "./actions";
import { Flash, PageHeader } from "../credentials/_ui";

export const dynamic = "force-dynamic";

export default async function StaffPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await getStaff();
  if (!me) return null;
  if (!can(me.role, Permission.StaffManage)) return <p className="text-sm text-danger">You do not have access to staff management.</p>;
  const sp = await searchParams;
  const staff = await listStaff();

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" subtitle="People who can sign in to the admin, and what they can do." />
      <Flash error={sp.error} ok={sp.ok ? "Saved." : undefined} />

      <form action={addStaffAction} className="grid gap-3 rounded-msc-lg bg-surface p-5 shadow-msc-sm sm:grid-cols-[1fr_1fr_160px_auto]">
        <input name="name" required placeholder="Full name" aria-label="Full name" className="h-10 rounded-msc border border-brand-navy/15 px-3 text-sm" />
        <input name="email" type="email" required placeholder="Work email (must match their sign-in)" aria-label="Email" className="h-10 rounded-msc border border-brand-navy/15 px-3 text-sm" />
        <select name="role" defaultValue={StaffRole.VIEWER} aria-label="Role" className="h-10 rounded-msc border border-brand-navy/15 px-3 text-sm">
          {Object.values(StaffRole).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <button className="h-10 rounded-pill bg-brand-blue px-5 text-sm font-semibold text-white">Add staff</button>
      </form>
      <p className="text-xs text-muted">
        New staff show as <em>Pending</em> until they sign in with a verified email that matches. Access is granted only to addresses listed here.
      </p>

      <div className="overflow-x-auto rounded-msc-lg bg-surface shadow-msc-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Role</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-brand-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-brand-navy">{s.name}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-xs">{!s.is_active ? "Deactivated" : isPending(s) ? "Pending first sign-in" : "Active"}</td>
                <td className="px-4 py-3">
                  <form action={updateStaffAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <select name="role" defaultValue={s.role} aria-label={`Role for ${s.name}`} className="h-9 rounded-msc border border-brand-navy/15 px-2 text-sm">
                      {Object.values(StaffRole).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <button className="h-9 rounded-pill border border-brand-navy/15 px-3 text-xs font-semibold text-brand-navy">Save</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={updateStaffAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="is_active" value={s.is_active ? "false" : "true"} />
                    <button className="text-xs font-semibold text-brand-blue hover:underline">{s.is_active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">No staff yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
