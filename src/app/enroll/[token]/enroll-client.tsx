"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Accordion, AccordionItem } from "@/src/components/ui/accordion";
import { SiteHeader } from "@/src/components/site-header";
import { EnrollmentForm } from "./enrollment-form";

export type EnrollPageData = {
  token: string;
  alreadyCompleted: boolean;
  course: {
    name: string;
    description: string | null;
    durationWeeks: number | null;
    mode: string;
    gstRatePct: number;
  };
  batch: { name: string; startDate: string | null; seatCapacity: number };
  pricePaise: number;
  discountPaise: number;
  expiresAt: string;
  lead: { name: string; email: string; phone: string | null };
};

const WHATSAPP_URL = "https://wa.me/919759249395";

function inr(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function EnrollClient({ data }: { data: EnrollPageData }) {
  const [reserved, setReserved] = useState(data.alreadyCompleted);
  const formRef = useRef<HTMLDivElement>(null);

  const nameParts = data.lead.name.trim().split(/\s+/);
  const defaults = {
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: data.lead.email,
    phone: data.lead.phone ?? "",
  };

  return (
    <div className="min-h-screen bg-canvas font-body text-ink antialiased">
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-brand-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_85%_-10%,rgba(74,208,255,0.10),transparent_60%),radial-gradient(60%_45%_at_8%_112%,rgba(0,88,158,0.30),transparent_62%)]"
        />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan" />
              Seat reserved for {data.lead.name.split(" ")[0]}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              You&rsquo;re one step from{" "}
              <span className="text-brand-cyan">{data.course.name}</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
              Complete your enrollment below to lock your seat in{" "}
              <strong className="text-white">{data.batch.name}</strong>
              {data.batch.startDate ? (
                <> — starting <strong className="text-white">{data.batch.startDate}</strong></>
              ) : null}
              . Only {data.batch.seatCapacity} seats per cohort, filled in order of payment.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/60"
          >
            <span>🔒 Secure enrollment</span>
            <span>🧾 GST invoice included</span>
            <span>⏳ Link valid till {data.expiresAt}</span>
          </motion.div>

          {!reserved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-8"
            >
              <Button
                size="lg"
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white text-brand-navy shadow-msc-md hover:bg-brand-pale"
              >
                Complete my enrollment ↓
              </Button>
            </motion.div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* ── Enrollment form + fee summary ───────────────── */}
        <div ref={formRef} className="-mt-8 grid gap-6 pb-4 lg:grid-cols-5">
          <motion.div {...fadeUp} className="lg:col-span-3">
            {reserved ? (
              <Card>
                <CardContent className="p-6 py-8 text-center sm:p-8">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl"
                  >
                    ✅
                  </motion.div>
                  <h2 className="mt-4 font-display text-2xl font-bold text-brand-navy">
                    Your seat is reserved
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                    Your enrollment application is in and your documents are on file. The final
                    step is the programme fee of{" "}
                    <strong className="text-ink">{inr(data.pricePaise)}</strong> — our team will
                    send your secure payment link on WhatsApp and email within a few hours. Your
                    seat is held until then.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-pill bg-wa px-6 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Chat with us on WhatsApp
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="mb-5">
                  <h2 className="font-display text-2xl font-bold text-brand-navy">
                    Enrollment form
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Complete every section to reserve your seat. Your details are used for your
                    enrollment record, verification, and GST invoice only.
                  </p>
                </div>
                <EnrollmentForm
                  token={data.token}
                  defaults={defaults}
                  onReserved={() => {
                    setReserved(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Fee summary — sticky on desktop */}
          <motion.aside {...fadeUp} className="lg:col-span-2">
            <Card className="lg:sticky lg:top-6">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Programme summary
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Programme</dt>
                    <dd className="text-right font-semibold text-ink">{data.course.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Cohort</dt>
                    <dd className="text-right font-medium">{data.batch.name}</dd>
                  </div>
                  {data.batch.startDate && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Starts</dt>
                      <dd className="text-right font-medium">{data.batch.startDate}</dd>
                    </div>
                  )}
                  {data.course.durationWeeks && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Duration</dt>
                      <dd className="text-right font-medium">{data.course.durationWeeks} weeks</dd>
                    </div>
                  )}
                  {data.discountPaise > 0 && (
                    <div className="flex justify-between gap-4 text-success">
                      <dt>Scholarship applied</dt>
                      <dd className="text-right font-semibold">−{inr(data.discountPaise)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 border-t border-brand-navy/10 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Programme fee</span>
                    <span className="font-display text-3xl font-bold text-brand-navy">
                      {inr(data.pricePaise)}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-xs text-muted">
                    inclusive of {data.course.gstRatePct}% GST · invoice issued on payment
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>

        {/* ── Why complete enrollment ─────────────────────── */}
        <motion.section {...fadeUp} className="py-12 sm:py-16">
          <h2 className="text-center font-display text-3xl font-bold text-brand-navy">
            Why complete your enrollment now
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "Your seat is finite",
                body: `Cohorts are capped at ${data.batch.seatCapacity} to keep mentoring personal. Enrollment closes when seats fill — not on a date.`,
              },
              {
                icon: "🧾",
                title: "Everything on record",
                body: "You get a GST tax invoice, a confirmed enrollment record, and onboarding within hours of payment — fully official, fully documented.",
              },
              {
                icon: "🚀",
                title: "Momentum matters",
                body: "Pre-work starts before day one. The earlier you're in, the more runway you have before the cohort kicks off.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full shadow-msc-sm">
                  <CardContent className="p-6">
                    <div className="text-2xl" aria-hidden>
                      {f.icon}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-brand-navy">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Payment section ─────────────────────────────── */}
        <motion.section {...fadeUp} className="pb-12 sm:pb-16">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="bg-brand-navy p-8 text-white">
                <h2 className="font-display text-2xl font-bold">
                  Payment, the safe way
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  After your form is in, you&rsquo;ll receive a secure payment link —
                  UPI, cards, and net-banking accepted. Never pay to a personal
                  account: all MedSkills Catalyst payments go through our official
                  payment link only.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-white/85">
                  <li>✓ 256-bit encrypted checkout</li>
                  <li>✓ Instant GST tax invoice on payment</li>
                  <li>✓ Refunds as per our published policy</li>
                </ul>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="font-display text-4xl font-bold text-brand-navy">
                  {inr(data.pricePaise)}
                </span>
                <span className="text-xs text-muted">one-time · incl. GST</span>
                {reserved ? (
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Payment link is on its way to your WhatsApp &amp; email. Questions?{" "}
                    <a href={WHATSAPP_URL} className="font-semibold text-brand-blue underline">
                      Chat with us
                    </a>
                    .
                  </p>
                ) : (
                  <Button
                    size="lg"
                    className="mt-2"
                    onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Complete the form first ↑
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <motion.section {...fadeUp} className="pb-16">
          <h2 className="text-center font-display text-3xl font-bold text-brand-navy">
            Common questions
          </h2>
          <Card className="mx-auto mt-8 max-w-3xl shadow-msc-sm">
            <CardContent className="px-6 py-2">
              <Accordion>
                <AccordionItem question="Is my seat confirmed after this form?">
                  Submitting the form reserves your seat. It&rsquo;s confirmed the moment
                  your programme fee is received — seats are allocated strictly in order
                  of payment.
                </AccordionItem>
                <AccordionItem question="What payment methods can I use?">
                  UPI, all major debit/credit cards, and net-banking — through our secure
                  payment link. We never accept payments to personal accounts.
                </AccordionItem>
                <AccordionItem question="Will I get a proper invoice?">
                  Yes. A GST tax invoice is generated automatically when your payment is
                  received and emailed to you — that&rsquo;s why we ask for your state and
                  billing address.
                </AccordionItem>
                <AccordionItem question="What if I need to defer to a later cohort?">
                  Talk to us before your cohort starts and we&rsquo;ll move you to the next
                  one, subject to seats. See the refund policy for full details.
                </AccordionItem>
                <AccordionItem question="My link expired — what now?">
                  Just message us on WhatsApp and we&rsquo;ll send a fresh link. Expiry
                  protects your offer terms; it doesn&rsquo;t cancel your conversation
                  with us.
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-brand-navy/10 bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo/MedSkills-Catalyst_Logo-01.svg"
              alt="MedSkills Catalyst"
              className="h-9 w-auto"
            />
            <div>
              <p className="font-display text-base font-bold leading-none text-brand-navy">
                MedSkills Catalyst
              </p>
              <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted">
                Upskill to Upscale
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
            <a href="/terms-of-use" className="hover:text-brand-blue">Terms</a>
            <a href="/privacy-policy" className="hover:text-brand-blue">Privacy</a>
            <a href="/refund-policy" className="hover:text-brand-blue">Refunds</a>
            <a href="/contact-us" className="hover:text-brand-blue">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
