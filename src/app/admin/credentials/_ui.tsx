import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicStatus } from "@/src/modules/credentials/status";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-msc border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-msc border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {ok}
      </p>
    );
  }
  return null;
}

const CRED_NAV = [
  { href: "/admin/credentials", label: "Overview" },
  { href: "/admin/credentials/list", label: "Credentials" },
  { href: "/admin/credentials/issue", label: "Issue" },
  { href: "/admin/credentials/bulk", label: "Bulk issue" },
  { href: "/admin/credentials/learners", label: "Learners" },
  { href: "/admin/credentials/programs", label: "Programs" },
  { href: "/admin/credentials/cohorts", label: "Cohorts" },
  { href: "/admin/credentials/templates", label: "Templates" },
  { href: "/admin/credentials/audit", label: "Audit" },
  { href: "/admin/credentials/settings", label: "Settings" },
];

export function CredentialNav() {
  return (
    <nav aria-label="Credentials" className="-mx-1 flex gap-1 overflow-x-auto border-b border-brand-navy/10 pb-2">
      {CRED_NAV.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className="whitespace-nowrap rounded-msc px-3 py-1.5 text-sm font-medium text-brand-navy/80 hover:bg-brand-pale hover:text-brand-navy"
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

const STATUS_STYLE: Record<string, string> = {
  VALID: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  REVOKED: "bg-red-100 text-red-700",
  SUPERSEDED: "bg-slate-200 text-slate-700",
  ISSUING: "bg-sky-100 text-sky-800",
  FAILED: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export function CredentialStatusBadge({ status }: { status: PublicStatus | "ISSUING" | "FAILED" }) {
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? ""}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-msc-lg bg-surface p-5 shadow-msc-sm ${className}`}>{children}</div>;
}

export function Field({ label, children, hint, htmlFor }: { label: string; children: ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-brand-navy">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "h-10 w-full rounded-msc border border-brand-navy/15 bg-surface px-3 text-sm text-ink focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20";

export const primaryBtn =
  "inline-flex h-10 items-center justify-center rounded-pill bg-brand-blue px-5 text-sm font-semibold text-white shadow-msc-sm hover:bg-brand-navy disabled:opacity-50";

export const secondaryBtn =
  "inline-flex h-10 items-center justify-center rounded-pill border border-brand-navy/15 bg-surface px-5 text-sm font-semibold text-brand-navy hover:border-brand-blue hover:text-brand-blue";

export const dangerBtn =
  "inline-flex h-10 items-center justify-center rounded-pill border border-danger/30 bg-red-50 px-5 text-sm font-semibold text-danger hover:bg-red-100";

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(date);
}

export function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);
}

export const EVENT_LABEL: Record<string, string> = {
  ISSUE_REQUESTED: "Issue requested",
  PDF_GENERATED: "PDF generated",
  RENDER_FAILED: "Generation failed",
  ISSUED: "Issued",
  EMAIL_SENT: "Email sent",
  EMAIL_FAILED: "Email failed",
  EMAIL_SUPPRESSED: "Email suppressed",
  EMAIL_RESENT: "Resend requested",
  REVOKED: "Revoked",
  REISSUED: "Reissued",
  SUPERSEDED: "Superseded",
  STATUS_CHANGED: "Status changed",
};
