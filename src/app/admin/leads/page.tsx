import Link from "next/link";
import { getStaff } from "@/src/lib/auth";
import { listLeads } from "@/src/modules/leads/queries";
import { listFiltersSchema } from "@/src/modules/leads/schemas";
import { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";
import { StatusBadge, STATUS_LABELS, SOURCE_LABELS, formatDate, leadCode } from "../ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await getStaff())) return null;
  const raw = await searchParams;
  const parsed = listFiltersSchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    source: typeof raw.source === "string" ? raw.source : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });
  const filters = parsed.success ? parsed.data : { page: 1 };

  const { leads, total, pages } = await listLeads(filters);
  const page = filters.page ?? 1;

  const qs = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && v === 1)) params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy">Leads</h1>
          <p className="mt-1 text-sm text-muted">{total} matching</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Export:</span>
          <a
            href={`/api/admin/leads/export${qs({ format: "csv", page: undefined })}`}
            className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-1.5 text-sm font-medium text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
          >
            CSV
          </a>
          <a
            href={`/api/admin/leads/export${qs({ format: "xlsx", page: undefined })}`}
            className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-1.5 text-sm font-medium text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
          >
            Excel
          </a>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search name, email, phone…"
          className="w-64 rounded-msc border border-brand-navy/15 bg-surface px-3 py-2 text-sm outline-none focus:border-brand-blue"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-2 text-sm"
        >
          <option value="">All stages</option>
          {Object.values(LeadStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={filters.source ?? ""}
          className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          {Object.values(LeadSource).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-pill bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-dark"
        >
          Filter
        </button>
        {(filters.q || filters.status || filters.source) && (
          <Link href="/admin/leads" className="text-sm text-muted hover:underline">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-msc-lg bg-surface shadow-msc-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-navy/10 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Captured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/5">
            {leads.map((l) => (
              <tr key={l.id.toString()} className="transition hover:bg-brand-pale/40">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-brand-blue">{leadCode(l.id)}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id.toString()}`} className="block">
                    <div className="font-semibold text-ink">{l.full_name}</div>
                    <div className="text-xs text-muted">
                      {l.email}
                      {l.mobile ? ` · ${l.mobile}` : ""}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 text-muted">{SOURCE_LABELS[l.source]}</td>
                <td className="px-4 py-3 text-muted">{l.assigned_to?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(l.created_at)}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No leads match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/leads${qs({ page: page - 1 })}`}
                className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-1.5 transition hover:border-brand-blue"
              >
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`/admin/leads${qs({ page: page + 1 })}`}
                className="rounded-msc border border-brand-navy/15 bg-surface px-3 py-1.5 transition hover:border-brand-blue"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
