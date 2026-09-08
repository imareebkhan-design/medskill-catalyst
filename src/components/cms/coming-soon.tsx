import { PageHeader } from "./ui";

/**
 * Placeholder for a section whose editing tools land in a later phase.
 *
 * These routes exist now for a reason beyond navigation tidiness: they carry
 * the real server-side authorization guard, so permission enforcement is
 * live and testable before any CRUD is built.
 */
export function ComingSoon({
  title,
  subtitle,
  summary,
}: {
  title: string;
  subtitle: string;
  summary: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-msc-lg border border-dashed border-brand-navy/15 bg-surface px-6 py-12 text-center">
        <h2 className="font-display text-lg font-bold text-brand-navy">
          Coming shortly
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {summary}
        </p>
      </div>
    </>
  );
}
