"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Accordion, AccordionItem } from "@/src/components/ui/accordion";
import { SiteHeader } from "@/src/components/site-header";
import { EnrollmentForm } from "./enrollment-form";
import { fbTrack } from "@/src/lib/meta-pixel";
import type { EnrollmentApplication } from "@/src/modules/enroll/schemas";
import { type UploadScope } from "@/src/modules/enroll/upload-client";
import {
  submitEnrollmentApplication,
  submitPublicEnrollmentApplication,
  createOrderAction,
  createPublicOrderAction,
  verifyPaymentAction,
  markPaymentFailedAction,
} from "./actions";

export type EnrollFlow =
  | { kind: "token"; token: string }
  | { kind: "public"; courseSlug: string };

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (resp: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Inject checkout.js once; resolves true when the SDK is available. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type EnrollPageData = {
  token: string;
  alreadyCompleted: boolean;
  alreadyPaid: boolean;
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

// Columns that sit side-by-side fade WITHOUT vertical travel, so they never
// appear misaligned while animating in.
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

/* ── Thin-stroke icons (inherit currentColor → stay on-palette) ───────── */
type IconProps = { className?: string };
const svgBase = "none";
function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconReceipt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconSeat({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="10" width="14" height="5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 15v3M17 15v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconSpark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A trust line item used across the page. */
function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
      <span>{children}</span>
    </li>
  );
}

export function EnrollClient({ data, flow }: { data: EnrollPageData; flow?: EnrollFlow }) {
  const resolvedFlow: EnrollFlow = flow ?? { kind: "token", token: data.token };
  const token = resolvedFlow.kind === "token" ? resolvedFlow.token : null;
  const courseSlug = resolvedFlow.kind === "public" ? resolvedFlow.courseSlug : null;
  const isPublic = resolvedFlow.kind === "public";

  const uploadScope: UploadScope =
    resolvedFlow.kind === "token"
      ? { token: resolvedFlow.token }
      : { courseSlug: resolvedFlow.courseSlug };

  const [reserved, setReserved] = useState(data.alreadyCompleted);
  const [paid, setPaid] = useState(data.alreadyPaid);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const nameParts = data.lead.name.trim().split(/\s+/);
  const firstName = nameParts[0] || "there";
  const defaults = {
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: data.lead.email,
    phone: data.lead.phone ?? "",
  };

  // GST-inclusive breakdown for the fee card (transparency / trust).
  const total = data.pricePaise;
  const gstRate = data.course.gstRatePct || 18;
  const base = Math.round(total / (1 + gstRate / 100));
  const gst = total - base;

  // Flow-agnostic form submit (token-based vs public per-course).
  const submitForm = useCallback(
    (values: EnrollmentApplication) =>
      token
        ? submitEnrollmentApplication(token, values)
        : submitPublicEnrollmentApplication(courseSlug as string, values),
    [token, courseSlug],
  );

  const startPayment = useCallback(
    async (eid?: string) => {
      setPayError(null);
      setPaying(true);

      const activeId = eid ?? enrollmentId;
      const res = token
        ? await createOrderAction(token)
        : activeId
          ? await createPublicOrderAction(activeId)
          : ({ status: "error", message: "Missing enrollment reference. Please refresh and try again." } as const);

      if (res.status !== "success") {
        // If it's already confirmed, reflect that instead of showing an error.
        if (/already confirmed/i.test(res.message)) setPaid(true);
        else setPayError(res.message);
        setPaying(false);
        return;
      }

      const order = res.order;
      const ready = await loadRazorpayScript();
      if (!ready || !window.Razorpay) {
        setPayError("Couldn't load the payment window. Check your connection and try again.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "MedSkills Catalyst",
        description: order.courseName,
        prefill: order.prefill,
        notes: { enrollment_id: order.enrollmentId },
        theme: { color: "#0A2A43" },
        handler: async (resp: RazorpayHandlerResponse) => {
          const v = await verifyPaymentAction({
            token: token ?? "",
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          if (v.status === "success") {
            setPaid(true);
            setPayError(null);
            fbTrack("Purchase", {
              currency: "INR",
              value: order.amountPaise / 100,
              content_name: order.courseName,
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            setPayError(v.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          },
        },
      });

      rzp.on("payment.failed", (resp) => {
        void markPaymentFailedAction(order.orderId, resp?.error?.description);
        setPayError(resp?.error?.description || "Payment failed. Please try again.");
        setPaying(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      rzp.open();
    },
    [token, enrollmentId],
  );

  const payLabel = paying ? "Opening secure checkout…" : `Pay ${inr(data.pricePaise)} securely`;

  return (
    <div className="min-h-screen bg-canvas font-body text-ink antialiased">
      <SiteHeader />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-brand-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_88%_-8%,rgba(74,208,255,0.16),transparent_58%),radial-gradient(55%_50%_at_-5%_110%,rgba(0,88,158,0.38),transparent_60%)]"
        />
        {/* faint hairline grid for texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:64px_64px]"
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-14 sm:pb-32 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-cyan backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              </span>
              {paid ? "Enrolment confirmed" : isPublic ? "Enrolment open" : `Seat reserved for ${firstName}`}
            </span>

            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.01em] text-white sm:text-6xl">
              You&rsquo;re one step from
              <br className="hidden sm:block" />{" "}
              <span className="text-brand-cyan">{data.course.name}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Lock your seat in <strong className="font-semibold text-white">{data.batch.name}</strong>
              {data.batch.startDate ? (
                <> — starting <strong className="font-semibold text-white">{data.batch.startDate}</strong></>
              ) : null}
              . Seats are limited and allocated in order of payment.
            </p>

            {/* meta chips */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { label: "Cohort", value: data.batch.name },
                ...(data.batch.startDate ? [{ label: "Starts", value: data.batch.startDate }] : []),
                ...(data.course.durationWeeks ? [{ label: "Duration", value: `${data.course.durationWeeks} weeks` }] : []),
              ].map((m) => (
                <span
                  key={m.label}
                  className="inline-flex items-baseline gap-2 rounded-msc border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm text-white/85"
                >
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brand-cyan/90">
                    {m.label}
                  </span>
                  <span className="font-medium">{m.value}</span>
                </span>
              ))}
            </div>

            {/* hero CTA — adapts to state */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              {paid ? (
                <span className="inline-flex items-center gap-2 rounded-pill bg-brand-cyan/15 px-5 py-3 text-sm font-semibold text-brand-cyan">
                  <IconCheck className="h-4 w-4" /> You&rsquo;re enrolled
                </span>
              ) : !reserved ? (
                <Button
                  size="lg"
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-pill bg-white px-7 font-semibold text-brand-navy shadow-msc-md hover:bg-brand-pale"
                >
                  Complete my enrollment ↓
                </Button>
              ) : (
                <span className="text-sm font-medium text-white/70">
                  Your seat is reserved — complete your payment below ↓
                </span>
              )}
              {!paid && (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-white/55">
                  <IconLock className="h-4 w-4 text-brand-cyan/80" />
                  Secure checkout via Razorpay
                </span>
              )}
            </motion.div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5">
        {/* ── Form + fee/seat card ──────────────────────────────────── */}
        <div ref={formRef} className="-mt-16 grid items-start gap-6 pb-4 lg:grid-cols-5">
          {/* Left: form / status */}
          <motion.div {...fadeIn} className="lg:col-span-3">
            {paid ? (
              <Card className="rounded-msc-xl shadow-msc-float">
                <CardContent className="p-8 text-center sm:p-10">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
                  >
                    <IconCheck className="h-8 w-8" />
                  </motion.div>
                  <h2 className="mt-5 font-display text-3xl font-semibold text-brand-navy">
                    You&rsquo;re confirmed
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                    Your seat in <strong className="text-ink">{data.course.name}</strong> is
                    officially confirmed. A GST tax invoice and confirmation are on their way to
                    your email. We&rsquo;ll follow up on WhatsApp with onboarding.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-wa px-6 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Chat with us on WhatsApp
                  </a>
                </CardContent>
              </Card>
            ) : reserved ? (
              <Card className="rounded-msc-xl shadow-msc-float">
                <CardContent className="p-8 text-center sm:p-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-pale text-brand-blue">
                    <IconSeat className="h-8 w-8" />
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-semibold text-brand-navy">
                    One step left — secure your seat
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                    Your application is in. Complete the programme fee of{" "}
                    <strong className="text-ink">{inr(data.pricePaise)}</strong> to lock your seat —
                    seats are allocated strictly in order of payment.
                  </p>
                  {payError && (
                    <p className="mx-auto mt-5 max-w-md rounded-msc bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">
                      {payError}
                    </p>
                  )}
                  <Button
                    size="lg"
                    className="mt-6 w-full rounded-pill font-semibold shadow-msc-glow sm:w-auto sm:px-8"
                    disabled={paying}
                    onClick={() => void startPayment()}
                  >
                    {payLabel} →
                  </Button>
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                    <IconLock className="h-3.5 w-3.5" /> UPI · cards · net-banking, via Razorpay
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="mb-6 pt-16">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-blue">
                    Enrollment
                  </span>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-brand-navy">
                    Complete your details
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Every field is used only for your enrollment record, verification, and GST
                    invoice. Takes about two minutes.
                  </p>
                </div>
                <EnrollmentForm
                  uploadScope={uploadScope}
                  submit={submitForm}
                  defaults={defaults}
                  onReserved={(res) => {
                    setReserved(true);
                    setEnrollmentId(res.enrollmentId);
                    fbTrack(
                      "CompleteRegistration",
                      { content_name: "Enrollment completed" },
                      res.eventId,
                    );
                    // Open Razorpay checkout right away.
                    void startPayment(res.enrollmentId);
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Right: fee / seat card (signature element) */}
          <motion.aside {...fadeIn} className="lg:col-span-2">
            <div className="overflow-hidden rounded-msc-xl bg-surface shadow-msc-float lg:sticky lg:top-6">
              {/* brand accent bar (navy → blue → cyan, all on-palette) */}
              <div className="h-1.5 w-full bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan" />
              <div className="p-6 sm:p-7">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Programme
                </span>
                <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-brand-navy">
                  {data.course.name}
                </h3>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-brand-navy/[0.07] pb-3">
                    <dt className="text-muted">Cohort</dt>
                    <dd className="text-right font-medium text-ink">{data.batch.name}</dd>
                  </div>
                  {data.batch.startDate && (
                    <div className="flex justify-between gap-4 border-b border-brand-navy/[0.07] pb-3">
                      <dt className="text-muted">Starts</dt>
                      <dd className="text-right font-medium text-ink">{data.batch.startDate}</dd>
                    </div>
                  )}
                  {data.course.durationWeeks && (
                    <div className="flex justify-between gap-4 border-b border-brand-navy/[0.07] pb-3">
                      <dt className="text-muted">Duration</dt>
                      <dd className="text-right font-medium text-ink">{data.course.durationWeeks} weeks</dd>
                    </div>
                  )}
                </dl>

                {/* fee breakdown (GST transparency) */}
                <div className="mt-5 rounded-msc-md bg-brand-pale/60 p-4">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Base fee</span>
                    <span className="tabular-nums">{inr(base)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-muted">
                    <span>GST ({gstRate}%)</span>
                    <span className="tabular-nums">{inr(gst)}</span>
                  </div>
                  {data.discountPaise > 0 && (
                    <div className="mt-2 flex justify-between text-sm font-medium text-success">
                      <span>Scholarship</span>
                      <span className="tabular-nums">−{inr(data.discountPaise)}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-baseline justify-between border-t border-brand-navy/10 pt-3">
                    <span className="text-sm font-semibold text-brand-navy">Total payable</span>
                    <span className="font-display text-3xl font-semibold tabular-nums text-brand-navy">
                      {inr(data.pricePaise)}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-[0.7rem] text-muted">inclusive of {gstRate}% GST</p>
                </div>

                {/* CTA */}
                <div className="mt-5">
                  {paid ? (
                    <div className="flex items-center justify-center gap-2 rounded-pill bg-success/10 py-3 text-sm font-semibold text-success">
                      <IconCheck className="h-4 w-4" /> Paid — seat confirmed
                    </div>
                  ) : reserved ? (
                    <Button
                      size="lg"
                      className="w-full rounded-pill font-semibold shadow-msc-glow"
                      disabled={paying}
                      onClick={() => void startPayment()}
                    >
                      {payLabel} →
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full rounded-pill font-semibold"
                      onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Complete the form first ↑
                    </Button>
                  )}
                </div>

                {/* trust row */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.7rem] font-medium text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <IconReceipt className="h-3.5 w-3.5 text-brand-blue" /> Instant GST invoice
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconShield className="h-3.5 w-3.5 text-brand-blue" /> Secured by Razorpay
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* ── Why enroll now ───────────────────────────────────────────── */}
        <motion.section {...fadeUp} className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Why now
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
              Your seat won&rsquo;t wait
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                Icon: IconSeat,
                title: "The cohort is finite",
                body: "Kept deliberately small so mentoring stays personal. Enrollment closes when seats fill — not on a fixed date.",
              },
              {
                Icon: IconReceipt,
                title: "Everything on record",
                body: "A GST tax invoice, a confirmed enrollment record, and onboarding within hours of payment. Fully official, fully documented.",
              },
              {
                Icon: IconSpark,
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
                <div className="group h-full rounded-msc-lg border border-brand-navy/[0.07] bg-surface p-6 shadow-msc-sm transition duration-300 hover:-translate-y-1 hover:shadow-msc-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-msc bg-brand-pale text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
                    <f.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-brand-navy">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Payment reassurance ──────────────────────────────────────── */}
        <motion.section {...fadeUp} className="pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-msc-xl bg-brand-navy shadow-msc-lg">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_100%_0%,rgba(74,208,255,0.14),transparent_60%)]"
            />
            <div className="relative grid gap-8 p-8 sm:p-10 md:grid-cols-2 md:items-center">
              <div>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                  Safe payment
                </span>
                <h2 className="mt-2 font-display text-3xl font-semibold text-white">
                  Pay the right way, every time
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                  Checkout runs on Razorpay — UPI, all major cards, and net-banking. MedSkills
                  Catalyst never accepts payments to a personal account. If a link looks off, it
                  isn&rsquo;t ours.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/85">
                  <TrustLine>Instant GST tax invoice on payment</TrustLine>
                  <TrustLine>Onboarding within hours of payment</TrustLine>
                  <TrustLine>Refunds as per our published policy</TrustLine>
                </ul>
              </div>
              <div className="rounded-msc-lg border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/50">
                  One-time fee
                </span>
                <div className="mt-2 font-display text-5xl font-semibold text-white">
                  {inr(data.pricePaise)}
                </div>
                <span className="text-xs text-white/50">incl. {gstRate}% GST</span>
                <div className="mt-6">
                  {paid ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan">
                      <IconCheck className="h-4 w-4" /> Paid — seat confirmed
                    </span>
                  ) : reserved ? (
                    <Button
                      size="lg"
                      className="w-full rounded-pill bg-brand-cyan font-semibold text-brand-navy shadow-msc-glow hover:bg-brand-cyan/90"
                      disabled={paying}
                      onClick={() => void startPayment()}
                    >
                      {paying ? "Opening checkout…" : "Pay securely now →"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full rounded-pill bg-white font-semibold text-brand-navy hover:bg-brand-pale"
                      onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Complete the form first ↑
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <motion.section {...fadeUp} className="pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Good to know
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-brand-navy sm:text-4xl">
              Common questions
            </h2>
          </div>
          <Card className="mx-auto mt-8 max-w-3xl rounded-msc-lg shadow-msc-sm">
            <CardContent className="px-6 py-2">
              <Accordion>
                <AccordionItem question="Is my seat confirmed after this form?">
                  Submitting the form reserves your seat. It&rsquo;s confirmed the moment your
                  programme fee is received — seats are allocated strictly in order of payment.
                </AccordionItem>
                <AccordionItem question="What payment methods can I use?">
                  UPI, all major debit/credit cards, and net-banking — through our secure Razorpay
                  checkout. We never accept payments to personal accounts.
                </AccordionItem>
                <AccordionItem question="Will I get a proper invoice?">
                  Yes. A GST tax invoice is generated automatically the moment your payment is
                  received and emailed to you — that&rsquo;s why we ask for your state and billing
                  address.
                </AccordionItem>
                <AccordionItem question="What if I need to defer to a later cohort?">
                  Talk to us before your cohort starts and we&rsquo;ll move you to the next one,
                  subject to seats. See the refund policy for full details.
                </AccordionItem>
                <AccordionItem question="My link expired — what now?">
                  Just message us on WhatsApp and we&rsquo;ll send a fresh link. Expiry protects
                  your offer terms; it doesn&rsquo;t cancel your conversation with us.
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-navy/10 bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
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
      {paying && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-navy/60 backdrop-blur-sm text-white">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-brand-cyan/20 opacity-70" />
            <div className="absolute h-14 w-14 animate-spin rounded-full border-2 border-white/5 border-t-brand-cyan" />
            <IconLock className="h-6 w-6 text-brand-cyan" />
          </div>
          <h3 className="mt-6 font-display text-xl font-medium tracking-tight">Opening secure checkout</h3>
          <p className="mt-2 text-sm text-white/60">Connecting to Razorpay. Please do not close this window.</p>
        </div>
      )}
    </div>
  );
}
