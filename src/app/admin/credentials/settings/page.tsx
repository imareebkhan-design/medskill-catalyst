import { adminAuthMode } from "@/src/lib/auth-mode";
import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import {
  CERTIFICATE_ID_FORMAT,
  CredentialConfigError,
  emailMode,
  ISSUER_NAME,
  publicBaseUrl,
  RESEND_LIMIT_PER_HOUR,
  storageMode,
  VERIFY_MISS_LIMIT,
} from "@/src/modules/credentials/config";
import { Card, PageHeader } from "../_ui";

export const dynamic = "force-dynamic";

function safe<T>(fn: () => T): T | string {
  try {
    return fn();
  } catch (e) {
    return e instanceof CredentialConfigError ? `⚠ ${e.message}` : "⚠ misconfigured";
  }
}

/** Read-only view of environment-driven configuration (changed via deployment env vars). */
export default async function SettingsPage() {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  const mail = emailMode();
  const rows: [string, string][] = [
    ["Issuer name", ISSUER_NAME],
    ["Canonical verification origin", String(safe(publicBaseUrl))],
    ["Certificate ID format", `${CERTIFICATE_ID_FORMAT.template} · ${CERTIFICATE_ID_FORMAT.randomLength} chars from ${CERTIFICATE_ID_FORMAT.alphabet}`],
    ["Learner email mode", mail.mode === "redirect" ? `redirect → ${mail.redirectTo}` : mail.mode + (mail.note ? ` (${mail.note})` : "")],
    ["Certificate storage", String(safe(storageMode))],
    ["Admin authentication", adminAuthMode()],
    ["Resend limit", `${RESEND_LIMIT_PER_HOUR} per credential per hour`],
    ["Public lookup limit", `${VERIFY_MISS_LIMIT.limit} failed lookups per ${VERIFY_MISS_LIMIT.windowSeconds / 60} minutes per client`],
    ["Search engine indexing", "Off (noindex on all verification pages)"],
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="These values come from the deployment's environment variables and are changed there, not here." />
      <Card>
        <dl>
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 border-b border-brand-navy/5 py-3 text-sm last:border-0 sm:grid-cols-[260px_1fr]">
              <dt className="text-muted">{k}</dt>
              <dd className="break-words font-mono text-xs text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
