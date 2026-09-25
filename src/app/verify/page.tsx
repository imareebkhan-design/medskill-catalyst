import { verifyCertificateIdAction } from "./actions";
import { ISSUER_NAME } from "@/src/modules/credentials/config";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const error = typeof sp.e === "string" ? sp.e : undefined;
  const typed = typeof sp.id === "string" ? sp.id.slice(0, 40) : "";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">Verify a credential</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-brand-navy sm:text-5xl">
          Is this certificate genuine?
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          Enter the certificate ID printed on a {ISSUER_NAME} certificate, or scan its QR code, to see the official record and its current status.
        </p>
      </div>

      <form action={verifyCertificateIdAction} className="rounded-msc-lg bg-surface p-5 shadow-msc-md sm:p-7">
        <label htmlFor="certificateId" className="block text-sm font-semibold text-brand-navy">
          Certificate ID
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="certificateId"
            name="certificateId"
            required
            maxLength={64}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            defaultValue={typed}
            placeholder="MSC-2026-FND-7K4P92"
            aria-describedby="certificateId-help"
            aria-invalid={error === "not-found" ? true : undefined}
            className="h-12 flex-1 rounded-msc border border-brand-navy/20 bg-surface px-4 font-mono text-base uppercase tracking-wider text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25"
          />
          <button type="submit" className="h-12 rounded-pill bg-brand-blue px-7 text-base font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
            Verify
          </button>
        </div>
        <p id="certificateId-help" className="mt-3 text-sm text-muted">
          The ID looks like <span className="font-mono text-brand-navy">MSC-2026-FND-7K4P92</span> and is printed near the QR code. Letters are not case-sensitive.
        </p>

        {error === "not-found" && (
          <div role="alert" className="mt-5 rounded-msc border border-danger/25 bg-red-50 px-4 py-3 text-sm text-danger">
            <p className="font-semibold">Credential not found</p>
            <p className="mt-1">
              No {ISSUER_NAME} credential matches that ID. Check it against the certificate. Every character must match, and IDs never contain the
              letters O, I, L or U or the digits 0 and 1.
            </p>
          </div>
        )}
        {error === "busy" && (
          <div role="alert" className="mt-5 rounded-msc border border-warning/30 bg-amber-50 px-4 py-3 text-sm text-warning">
            Too many unsuccessful lookups from your connection. Please wait a few minutes and try again.
          </div>
        )}
      </form>
    </div>
  );
}
