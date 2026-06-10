"use client";

import { useEffect, useState } from "react";
import { WEBINAR } from "@/lib/webinar.config";
import { googleCalendarUrl } from "@/lib/calendar";
import { Button, ButtonLink } from "./ui/Button";
import {
  trackWhatsappJoin,
  trackLeadMagnetDownload,
  trackCtaClick,
} from "@/lib/analytics";

export function ThankYou() {
  const [gcalUrl, setGcalUrl] = useState("#");
  const [referUrl, setReferUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setGcalUrl(googleCalendarUrl());
    if (typeof window !== "undefined") {
      setReferUrl(
        `${window.location.origin}/webinar?utm_source=referral&src=referral`
      );
    }
  }, []);

  async function copyRefer() {
    try {
      await navigator.clipboard.writeText(referUrl);
      setCopied(true);
      trackCtaClick("copy_referral_link", "thank_you");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="font-body">

      {/* ── CONFIRMATION HEADER ──────────────────────────────────────── */}
      <section className="bg-teal-deep px-5 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald text-3xl text-white">
            ✓
          </div>

          <h1 className="mt-6 font-display font-bold leading-[1.1] tracking-[-0.02em] [font-size:clamp(1.8rem,3.8vw,2.8rem)]">
            You&apos;re in. See you on {WEBINAR.dateLabel}.
          </h1>

          {/* Pillar 2 — what to expect (2–3 sentences) */}
          <p className="mt-5 text-[1.1rem] leading-[1.75] text-white/75">
            Your seat is confirmed for <strong className="text-white">{WEBINAR.timeLabel}</strong>.
            In 90 minutes you&apos;ll leave with a clear map of the MedTech hiring
            landscape, a resume angle that works for switchers, and a specific
            next step for your exact background. Come ready with one question
            about your situation — the Q&amp;A is where the real value happens.
          </p>

          {/* Pillar 2 — single dominant pre-join action */}
          <div className="mt-10">
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.15em] text-teal-leg">
              One thing to do right now
            </p>
            <ButtonLink
              href={WEBINAR.whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsappJoin}
              className="w-full sm:w-auto"
              variant="secondary"
            >
              Join the WhatsApp group →
            </ButtonLink>
            <p className="mt-3 text-sm text-white/50">
              This is where the Zoom link, reminders, and any recording go.
              Don&apos;t skip it.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECONDARY NEXT STEPS ─────────────────────────────────────── */}
      <section className="bg-teal-pale px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">

          {/* Eyebrow */}
          <p className="mb-8 text-center text-[0.72rem] font-bold uppercase tracking-[0.15em] text-emerald">
            A few more things worth doing
          </p>

          <div className="grid gap-5 sm:grid-cols-3">

            {/* Add to calendar */}
            <Card
              title="Block your calendar"
              body="One tap so you don't forget. Pick Google or download for Apple / Outlook."
            >
              <div className="flex flex-col gap-2">
                <ButtonLink
                  href={gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="w-full"
                  onClick={() => trackCtaClick("add_gcal", "thank_you")}
                >
                  Google Calendar
                </ButtonLink>
                <ButtonLink
                  href="/webinar/calendar.ics"
                  variant="secondary"
                  className="w-full"
                  onClick={() => trackCtaClick("add_ics", "thank_you")}
                >
                  Apple / Outlook (.ics)
                </ButtonLink>
              </div>
            </Card>

            {/* Lead magnet */}
            <Card
              title="Download your free guide"
              body={WEBINAR.leadMagnetTitle}
            >
              <ButtonLink
                href={WEBINAR.leadMagnetUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="w-full"
                onClick={trackLeadMagnetDownload}
              >
                Download the guide (PDF) ↓
              </ButtonLink>
            </Card>

            {/* Referral */}
            <Card
              title="Bring a friend"
              body="Know someone stuck in pharma who'd want in? Share your link."
            >
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referUrl}
                    aria-label="Your referral link"
                    className="w-full rounded-msc border border-ink/15 bg-white px-3 py-2 text-sm text-ink/70"
                  />
                  <Button type="button" variant="secondary" onClick={copyRefer}>
                    {copied ? "✓" : "Copy"}
                  </Button>
                </div>
                <a
                  className="text-sm font-semibold text-emerald-dark hover:underline"
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `I just registered for this free MedTech career masterclass — thought you'd want in: ${referUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCtaClick("refer_whatsapp", "thank_you")}
                >
                  Share on WhatsApp →
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── ANTICIPATION CLOSE (Pillar 2) ────────────────────────────── */}
      <section className="border-t border-ink/8 bg-surface px-5 py-12 text-center sm:px-8">
        <div className="mx-auto max-w-xl">
          <p className="font-display text-[1.2rem] font-bold leading-[1.4] tracking-[-0.01em] text-teal-deep">
            This session is practical, not theoretical.
            Show up ready to act — not just to listen.
          </p>
          <p className="mt-3 text-[1rem] leading-[1.7] text-ink/60">
            We&apos;ll see you on {WEBINAR.dateLabel} at {WEBINAR.timeLabel}.
            Questions before then? Email{" "}
            <a
              className="font-semibold text-teal-mid underline underline-offset-2"
              href={`mailto:${WEBINAR.supportEmail}`}
            >
              {WEBINAR.supportEmail}
            </a>
            .
          </p>
        </div>
      </section>

    </main>
  );
}

function Card({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-msc-lg border border-ink/8 bg-surface p-6 shadow-msc-sm">
      <h2 className="font-display text-[1.1rem] font-bold leading-[1.3] tracking-[-0.01em] text-teal-deep">
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
