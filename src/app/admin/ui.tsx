import type { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";

export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-sky-100 text-sky-800",
  DISCOVERY_CALL: "bg-cyan-100 text-cyan-800",
  QUALIFIED: "bg-amber-100 text-amber-800",
  LINK_SENT: "bg-violet-100 text-violet-800",
  CONVERTED: "bg-emerald-100 text-emerald-800",
  LOST: "bg-red-100 text-red-700",
};

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DISCOVERY_CALL: "Discovery call",
  QUALIFIED: "Qualified",
  LINK_SENT: "Link sent",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  ORGANIC: "Organic",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  MANUAL: "Manual",
  IMPORT: "Import",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}
