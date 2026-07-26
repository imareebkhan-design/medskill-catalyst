import Link from "next/link";
import { getStaff } from "@/src/lib/auth";
import { dashboardStats } from "@/src/modules/leads/queries";
import { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";
import { StatusBadge, STATUS_LABELS, SOURCE_LABELS, formatDate } from "./ui";

export const dynamic = "force-dynamic";

const FUNNEL_ORDER: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.DISCOVERY_CALL,
  LeadStatus.QUALIFIED,
  LeadStatus.LINK_SENT,
  LeadStatus.CONVERTED,
];

export default async function AdminDashboard() {
  // Auth guard: layouts aren't a reliable boundary in the App Router, so each
  // page must gate itself before touching data. Unauthed → layout shows the form.
  if (!(await getStaff())) return null;
  const stats = await dashboardStats();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.total} leads total · {stats.newThisWeek} new in the last 7 days
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="rounded-pill bg-brand-blue px-5 py-2 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-emerald-dark"
        >
          View all leads
        </Link>
      </div>

      {/* Funnel */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Pipeline
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FUNNEL_ORDER.map((s) => (
            <Link
              key={s}
              href={`/admin/leads?status=${s}`}
              className="rounded-msc-md bg-surface p-4 shadow-msc-sm transition hover:shadow-msc-md"
            >
              <div className="text-2xl font-bold text-brand-navy">
                {stats.statusCounts[s]}
              </div>
              <div className="mt-1 text-xs font-medium text-muted">{STATUS_LABELS[s]}</div>
            </Link>
          ))}
        </div>
        <div className="mt-3">
          <Link
            href={`/admin/leads?status=${LeadStatus.LOST}`}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            Lost: {stats.statusCounts.LOST}
          </Link>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Lead sources
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {Object.values(LeadSource).map((s) => (
            <Link
              key={s}
              href={`/admin/leads?source=${s}`}
              className="rounded-msc-md bg-surface p-3 shadow-msc-sm transition hover:shadow-msc-md"
            >
              <div className="text-xl font-bold text-brand-navy">{stats.sourceCounts[s]}</div>
              <div className="mt-0.5 text-xs text-muted">{SOURCE_LABELS[s]}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Latest leads
        </h2>
        <div className="overflow-hidden rounded-msc-lg bg-surface shadow-msc-sm">
          <ul className="divide-y divide-brand-navy/5">
            {stats.recent.map((l) => (
              <li key={l.id.toString()}>
                <Link
                  href={`/admin/leads/${l.id.toString()}`}
                  className="flex items-center justify-between px-4 py-3 transition hover:bg-brand-pale/40"
                >
                  <div>
                    <div className="text-sm font-semibold text-ink">{l.full_name}</div>
                    <div className="text-xs text-muted">{l.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={l.status} />
                    <span className="text-xs text-muted">{formatDate(l.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
            {stats.recent.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No leads yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
