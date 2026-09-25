import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/src/lib/db";
import { DEV_STAFF_COOKIE, devAuthAllowed } from "@/src/lib/auth";
import { ROLE_LABELS } from "@/src/lib/permissions";

/**
 * LOCAL DEVELOPMENT ONLY. Pick any staff row to act as, so role checks can be
 * exercised without Clerk keys. devAuthAllowed() refuses on Vercel and unless
 * DEV_AUTH_ENABLE=local-only is set alongside ADMIN_AUTH_MODE=dev.
 */
async function pickIdentity(formData: FormData) {
  "use server";
  if (!devAuthAllowed()) redirect("/admin");
  const id = String(formData.get("staff_id") ?? "");
  (await cookies()).set(DEV_STAFF_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/admin");
}

export async function DevLogin() {
  if (!devAuthAllowed()) {
    return <p className="p-8 text-sm text-danger">Dev auth is disabled on this deployment.</p>;
  }
  const staff = await db.staffUser.findMany({ orderBy: { role: "asc" } });
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-body">
      <form action={pickIdentity} className="w-full max-w-sm rounded-msc-lg bg-surface p-8 shadow-msc-md">
        <p className="rounded-msc bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          LOCAL DEVELOPMENT SIGN-IN — not available on any deployed environment
        </p>
        <label className="mt-4 block text-sm font-semibold text-brand-navy" htmlFor="staff_id">
          Act as
        </label>
        <select id="staff_id" name="staff_id" className="mt-2 h-11 w-full rounded-msc border border-brand-navy/15 px-3 text-sm">
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {ROLE_LABELS[s.role]} {s.is_active ? "" : "(inactive)"}
            </option>
          ))}
        </select>
        <button type="submit" className="mt-4 h-11 w-full rounded-msc bg-brand-blue text-sm font-semibold text-white">
          Continue
        </button>
      </form>
    </div>
  );
}
