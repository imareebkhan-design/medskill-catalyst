import { guardCmsPage } from "@/src/lib/cms-guard";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, roleCan } from "@/src/lib/cms-roles";
import { Card, PageHeader } from "@/src/components/cms/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile" };

/** What this person can do, phrased for a non-technical reader. */
const PERMISSION_LINES = [
  { capability: "content:edit", label: "Write and edit website content" },
  { capability: "content:publish", label: "Publish content to the live website" },
  { capability: "content:archive", label: "Archive content you no longer need" },
  { capability: "content:reorder", label: "Change the order things appear in" },
  { capability: "users:manage", label: "Manage who can sign in" },
  { capability: "activity:view", label: "See the full activity log" },
] as const;

export default async function ProfilePage() {
  const user = await guardCmsPage();

  return (
    <>
      <PageHeader title="Your profile" subtitle="Your account and what you can do." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold text-brand-navy">Account</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted">Name</dt>
              <dd className="text-sm font-semibold text-ink">{user.full_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted">Email</dt>
              <dd className="truncate text-sm font-semibold text-ink">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-muted">Access level</dt>
              <dd className="text-sm font-semibold text-ink">{ROLE_LABELS[user.role]}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-brand-navy/8 pt-3 text-xs leading-relaxed text-muted">
            {ROLE_DESCRIPTIONS[user.role]}
          </p>
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-brand-navy">
            What you can do
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PERMISSION_LINES.map((line) => {
              const allowed = roleCan(user.role, line.capability);
              return (
                <li key={line.capability} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      allowed ? "bg-emerald-50 text-success" : "bg-brand-navy/8 text-muted"
                    }`}
                  >
                    {allowed ? "✓" : "–"}
                  </span>
                  <span
                    className={`text-sm ${allowed ? "text-ink" : "text-muted line-through decoration-brand-navy/20"}`}
                  >
                    {line.label}
                    <span className="sr-only">
                      {allowed ? " — allowed" : " — not available to you"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-5">
        <h2 className="font-display text-base font-bold text-brand-navy">
          Need your password changed?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Ask a Super Admin to set a new one for you. Changing your own password
          from this screen is coming in a later update.
        </p>
      </Card>
    </>
  );
}
