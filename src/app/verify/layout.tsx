import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ISSUER_NAME } from "@/src/modules/credentials/config";

export const metadata: Metadata = {
  title: `Verify a credential · ${ISSUER_NAME}`,
  description: `Confirm that a ${ISSUER_NAME} certificate is genuine and check its current status.`,
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-body text-ink">
      <header className="border-b border-brand-navy/10 bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-5">
          <a href="/" className="flex items-center gap-3" aria-label={`${ISSUER_NAME} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo/MedSkills-Catalyst_Logo-01.svg" alt="" className="h-9 w-auto" />
            <span className="leading-none">
              <span className="block font-display text-[1.05rem] font-bold leading-none text-brand-navy">{ISSUER_NAME}</span>
              <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted">Credential verification</span>
            </span>
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-5 sm:py-14">{children}</main>
      <footer className="border-t border-brand-navy/10 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-5">
          This page is the authoritative record of {ISSUER_NAME} credentials. A certificate is genuine only if it appears here with its
          current status; a PDF or printout alone is not proof.
        </div>
      </footer>
    </div>
  );
}
