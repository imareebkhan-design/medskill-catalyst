import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/src/lib/auth";
import { getLead, listActiveStaff } from "@/src/modules/leads/queries";
import { ALLOWED } from "@/src/modules/leads/service";
import { LeadStatus, type ActivityType } from "@/src/generated/prisma/enums";
import { StatusBadge, STATUS_LABELS, SOURCE_LABELS, formatDate, leadCode } from "../../ui";
import { transitionLeadAction, addNoteAction, assignLeadAction } from "../actions";

export const dynamic = "force-dynamic";

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  NOTE: "📝",
  CALL: "📞",
  STATUS_CHANGE: "🔀",
  EMAIL: "✉️",
  SYSTEM: "⚙️",
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await getStaff())) return null;
  const { id } = await params;
  const { error } = await searchParams;
  let leadId: bigint;
  try {
    leadId = BigInt(id);
  } catch {
    notFound();
  }

  const [lead, staff] = await Promise.all([getLead(leadId), listActiveStaff()]);
  if (!lead) notFound();

  const nextStatuses = ALLOWED[lead.status].filter((s) => s !== LeadStatus.LOST);
  const canLose = ALLOWED[lead.status].includes(LeadStatus.LOST);
  const extra = lead.extra as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-msc-md border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div>
        <Link href="/admin/leads" className="text-sm text-muted hover:underline">
          ← All leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-brand-navy">
            {lead.full_name}
          </h1>
          <span className="font-mono text-sm font-semibold text-brand-blue">{leadCode(lead.id)}</span>
          <StatusBadge status={lead.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {lead.email}
          {lead.mobile ? ` · ${lead.mobile}` : ""} · {SOURCE_LABELS[lead.source]} ·
          captured {formatDate(lead.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-msc-lg bg-surface p-5 shadow-msc-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Form</dt>
              <dd>{lead.form_type}</dd>
              <dt className="text-muted">Background</dt>
              <dd>{lead.background ?? "—"}</dd>
              <dt className="text-muted">UTM</dt>
              <dd>
                {[lead.utm_source, lead.utm_medium, lead.utm_campaign]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </dd>
              <dt className="text-muted">Landing page</dt>
              <dd className="truncate">{lead.landing_page ?? "—"}</dd>
              {lead.lost_reason && (
                <>
                  <dt className="text-muted">Lost reason</dt>
                  <dd className="text-danger">{lead.lost_reason}</dd>
                </>
              )}
              {lead.invoices.length > 0 && (
                <>
                  <dt className="text-muted">Invoices</dt>
                  <dd>
                    {lead.invoices
                      .map((i) => `${i.invoice_no} (₹${i.total.toString()}, ${i.status})`)
                      .join(", ")}
                  </dd>
                </>
              )}
            </dl>
            {Object.keys(extra).length > 0 && (
              <details className="mt-3 text-xs text-muted">
                <summary className="cursor-pointer select-none">Extra fields</summary>
                <pre className="mt-2 overflow-x-auto rounded-msc bg-canvas p-3">
                  {JSON.stringify(extra, null, 2)}
                </pre>
              </details>
            )}
          </section>

          <section className="rounded-msc-lg bg-surface p-5 shadow-msc-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Timeline
            </h2>
            <ul className="space-y-3">
              {lead.activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span aria-hidden>{ACTIVITY_ICONS[a.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink">{a.body}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {a.actor?.name ?? "System"} · {formatDate(a.created_at)}
                    </p>
                  </div>
                </li>
              ))}
              {lead.activities.length === 0 && (
                <li className="text-sm text-muted">No activity yet.</li>
              )}
            </ul>
          </section>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <section className="rounded-msc-lg bg-surface p-5 shadow-msc-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Move stage
            </h2>
            <div className="flex flex-col gap-2">
              {nextStatuses.map((s) => (
                <form key={s} action={transitionLeadAction}>
                  <input type="hidden" name="leadId" value={id} />
                  <input type="hidden" name="to" value={s} />
                  <button
                    type="submit"
                    className="w-full rounded-pill bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-dark"
                  >
                    → {STATUS_LABELS[s]}
                  </button>
                </form>
              ))}
              {nextStatuses.length === 0 && !canLose && (
                <p className="text-sm text-muted">This lead is in a final stage.</p>
              )}
            </div>
            {canLose && (
              <form action={transitionLeadAction} className="mt-4 border-t border-brand-navy/10 pt-4">
                <input type="hidden" name="leadId" value={id} />
                <input type="hidden" name="to" value={LeadStatus.LOST} />
                <label className="text-xs font-medium text-muted">
                  Mark as lost (reason required)
                </label>
                <input
                  name="reason"
                  required
                  minLength={3}
                  placeholder="Why was this lead lost?"
                  className="mt-1 w-full rounded-msc border border-brand-navy/15 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  className="mt-2 w-full rounded-pill border border-danger/30 bg-red-50 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-red-100"
                >
                  Mark lost
                </button>
              </form>
            )}
          </section>

          <section className="rounded-msc-lg bg-surface p-5 shadow-msc-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Assignment
            </h2>
            <form action={assignLeadAction} className="flex gap-2">
              <input type="hidden" name="leadId" value={id} />
              <select
                name="staffId"
                defaultValue={lead.assigned_to?.id ?? ""}
                className="flex-1 rounded-msc border border-brand-navy/15 bg-surface px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-pill bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue"
              >
                Save
              </button>
            </form>
          </section>

          <section className="rounded-msc-lg bg-surface p-5 shadow-msc-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Log activity
            </h2>
            <form action={addNoteAction} className="space-y-2">
              <input type="hidden" name="leadId" value={id} />
              <select
                name="type"
                className="w-full rounded-msc border border-brand-navy/15 bg-surface px-3 py-2 text-sm"
              >
                <option value="NOTE">Note</option>
                <option value="CALL">Call</option>
              </select>
              <textarea
                name="body"
                required
                rows={3}
                placeholder="What happened?"
                className="w-full rounded-msc border border-brand-navy/15 px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                className="w-full rounded-pill bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-dark"
              >
                Add to timeline
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
