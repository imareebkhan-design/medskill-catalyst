import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Shared CMS presentation primitives.
 *
 * Copy rules for everything in here: no database or developer vocabulary, no
 * raw identifiers, no error codes. The audience is a non-technical team member
 * who needs to know what happened and what to do next.
 */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-navy">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** A single headline number. `hint` carries the secondary detail. */
export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold leading-none text-brand-navy">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </>
  );

  if (!href) return <Card>{body}</Card>;

  return (
    <Link
      href={href}
      className="block rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm transition hover:-translate-y-0.5 hover:shadow-msc-md"
    >
      {body}
    </Link>
  );
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-50 text-success",
  CLOSING_SOON: "bg-amber-50 text-warning",
  CLOSED: "bg-red-50 text-danger",
  COMING_SOON: "bg-brand-pale text-brand-blue",
};

export const ADMISSIONS_LABELS: Record<string, string> = {
  OPEN: "Open",
  CLOSING_SOON: "Closing soon",
  CLOSED: "Closed",
  COMING_SOON: "Coming soon",
};

export function AdmissionsBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        STATUS_STYLES[status] ?? "bg-brand-pale text-brand-blue"
      }`}
    >
      {ADMISSIONS_LABELS[status] ?? status}
    </span>
  );
}

/** Empty state: says what is missing and offers the one obvious next step. */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-msc-lg border border-dashed border-brand-navy/15 bg-surface px-6 py-12 text-center">
      <h3 className="font-display text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-pill bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
        >
          <Icon name="plus" className="h-4 w-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * Error state. Deliberately free of codes and stack traces — it explains the
 * situation in plain language and gives the reader something to do.
 */
export function ErrorState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-msc-lg border border-warning/25 bg-amber-50/60 px-6 py-8">
      <h3 className="font-display text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/75">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Skeleton block used by loading.tsx files. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-msc bg-brand-navy/8 ${className}`} />;
}

export function QuickAction({
  href,
  label,
  description,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  description: string;
  icon: "calendar" | "stories" | "faculty" | "external";
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-msc bg-brand-pale text-brand-blue">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </>
  );

  const className =
    "flex items-start gap-4 rounded-msc-lg border border-brand-navy/8 bg-surface p-5 text-left shadow-msc-sm transition hover:-translate-y-0.5 hover:shadow-msc-md";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
