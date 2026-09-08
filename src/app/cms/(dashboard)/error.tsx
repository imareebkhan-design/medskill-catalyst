"use client";

/**
 * Last-resort boundary for anything the page did not handle. Deliberately
 * shows no error code or stack trace — the audience is a non-technical
 * team member. The real detail is logged server-side.
 */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-msc-lg border border-warning/25 bg-amber-50/60 px-6 py-8">
      <h2 className="font-display text-lg font-bold text-brand-navy">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/75">
        We couldn&apos;t finish loading this page. Nothing has been lost. Please
        try again — if it keeps happening, let your developer know.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
      >
        Try again
      </button>
    </div>
  );
}
