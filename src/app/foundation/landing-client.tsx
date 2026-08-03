"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Accordion, AccordionItem } from "@/src/components/ui/accordion";
import { SiteHeader } from "@/src/components/site-header";

const PAYMENT_URL = "https://rzp.io/rzp/sD5lWTEc";

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
function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill={svgBase} className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function FoundationLandingClient({ data }: { data: any }) {
  return (
    <div className="min-h-screen bg-[#F6F8FA] font-body text-ink antialiased relative">
      {/* Canvas grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <SiteHeader />

      {/* ── Urgent Top Notification Banner ── */}
      <div className="bg-brand-blue/10 border-b border-brand-blue/10 text-center py-2.5 px-4 text-xs font-semibold text-brand-navy relative z-20">
        ⚡ Orientation starting 8 August 2026. Only a few seats remaining for Cohort 1.
      </div>

      {/* ── 1. Hero Section ── */}
      <section className="relative z-10 px-5 pt-12 pb-16 md:pt-24 md:pb-24 border-b border-brand-navy/5">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-brand-blue uppercase">
            🎓 Foundation Module
          </div>
          
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-navy sm:text-6xl leading-[1.1] max-w-3xl mx-auto">
            Break Into The <span className="text-brand-blue">MedTech Industry</span>
          </h1>

          <p className="text-lg leading-relaxed text-muted max-w-2xl mx-auto">
            The essential playbook for life-science graduates to break into the MedTech industry. Master the device ecosystem, domestic manufacturing tracks, and MedTech recruitment frameworks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href={PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-blue px-8 text-base font-semibold text-white shadow-msc-glow transition hover:opacity-95"
            >
              Book Now — ₹4,999 securely →
            </a>
            <a
              href="#curriculum"
              className="inline-flex h-12 items-center justify-center rounded-pill border border-brand-navy/20 px-8 text-base font-semibold text-brand-navy hover:bg-brand-navy/5 transition"
            >
              Explore Curriculum
            </a>
          </div>

          {/* Stat bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto text-left border-t border-brand-navy/10 mt-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-msc bg-brand-pale text-brand-blue">
                <IconCalendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Next Batch Starts</span>
                <span className="font-display font-bold text-brand-navy text-sm">{data.batch.startDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-msc bg-brand-pale text-brand-blue">
                <IconSeat className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Cohort Limit</span>
                <span className="font-display font-bold text-brand-navy text-sm">Limited Seats Available</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-msc bg-brand-pale text-brand-blue">
                <IconShield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-muted block">Program Level</span>
                <span className="font-display font-bold text-brand-navy text-sm">Foundation Module</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Who Should Enroll ── */}
      <section className="px-5 py-16 md:py-24 relative z-10 border-b border-brand-navy/5">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Target Audience</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              Who Should Attend the Foundation Module
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Science & Pharma Graduates",
                body: "B.Sc, B.Pharm, Biotech, and Biomedical graduates looking to transition away from low-paying lab/research roles into corporate business tracks.",
              },
              {
                title: "Aspiring Medical Sales Reps",
                body: "Professionals currently working in general sales, insurance, or pharmaceuticals who want to break into the high-margin medical devices industry.",
              },
              {
                title: "Healthcare Practitioners",
                body: "Nurses, clinical support assistants, and technical hospital staff aiming to leverage their clinical familiarity for corporate MedTech roles.",
              },
            ].map((a, idx) => (
              <div key={idx} className="rounded-msc-lg border border-brand-navy/[0.06] bg-surface p-6 shadow-msc-sm border-t-4 border-t-brand-blue">
                <div className="font-display text-lg font-bold text-brand-navy mb-2">{a.title}</div>
                <p className="text-sm leading-relaxed text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Curriculum Section ── */}
      <section id="curriculum" className="px-5 py-16 md:py-24 relative z-10 border-b border-brand-navy/5">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">The Curriculum</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              Designed by the people who matter in the MedTech industry
            </h2>
            <p className="text-base leading-relaxed text-muted max-w-2xl mx-auto pt-1">
              Every module of the Foundation was shaped in direct collaboration with MedTech leaders who told us exactly what they wish new hires already knew.
            </p>
          </div>

          <Card className="border border-brand-navy/[0.05] shadow-msc-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <Accordion>
                <AccordionItem question="1. Pre-Program Baseline Assessment">
                  Gauge your current understanding of clinical concepts and corporate commercial readiness to benchmark your career progress.
                </AccordionItem>
                <AccordionItem question="2. Categories of Medical Devices">
                  Explore the full product spectrum: diagnostic, therapeutic, surgical, implantable, and monitoring devices, and how risk levels (Class A–D) work.
                </AccordionItem>
                <AccordionItem question="3. Medical Devices Across Specialties">
                  Master product portfolios and terminology across major clinical disciplines including Cardiology, Orthopedics, Neurology, Radiology, and Critical Care.
                </AccordionItem>
                <AccordionItem question="4. Manufacturing & Imports in India">
                  Examine India's domestic MedTech manufacturing shift (PLI schemes &amp; medical device parks) vs. the distribution dynamics of global import brands.
                </AccordionItem>
                <AccordionItem question="5. Career Opportunities in MedTech">
                  Map entry-level and mid-career tracks across sales, marketing, clinical support, and regulatory affairs, with salary expectations and growth paths.
                </AccordionItem>
                <AccordionItem question="6. MedTech vs Pharma Industry - Skillset">
                  Understand the key differences between volume-driven pharma detailing and consultative, multi-stakeholder device selling, and how to transition.
                </AccordionItem>
                <AccordionItem question="7. Knowledge Check &amp; Reflection Assignment">
                  Consolidate your learning with a final module assessment and a real-world clinical case reflection assignment reviewed by industry mentors.
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 3.5 What You Get ── */}
      <section className="px-5 py-16 md:py-24 bg-white/50 relative z-10 border-b border-brand-navy/5">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Program Benefits</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              What You Get Upon Registration
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-4 sm:grid-cols-2">
            {[
              {
                title: "Interactive Live Training",
                desc: "Live orientation, pre-work reviews, and interactive weekend sessions directly mentored by corporate leadership.",
              },
              {
                title: "Baseline Skill Audit",
                desc: "Pre-program assessment to benchmark your clinical vocabulary, sales acumen, and target growth tracks.",
              },
              {
                title: "Actionable Mentorship",
                desc: "Real-world reflection assignments evaluated with 1-on-1 feedback from former MNC division managers.",
              },
              {
                title: "Verified Credentials",
                desc: "A shareable, verified MedSkills Catalyst Certificate of Competency to showcase on LinkedIn & resume.",
              },
            ].map((item, idx) => (
              <div key={idx} className="rounded-msc-lg border border-brand-navy/[0.06] bg-surface p-5 shadow-msc-sm flex flex-col justify-between">
                <div>
                  <div className="mb-3 text-brand-blue">
                    <IconCheck className="h-6 w-6" />
                  </div>
                  <div className="font-display font-bold text-brand-navy text-base mb-1">{item.title}</div>
                  <p className="text-xs leading-relaxed text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Mentors Section ── */}
      <section className="px-5 py-16 md:py-24 bg-white/50 relative z-10 border-b border-brand-navy/5">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">The Faculty</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
              Mentored by MedTech Leaders
            </h2>
            <p className="text-base leading-relaxed text-muted max-w-2xl mx-auto pt-1">
              No academics. Just leaders who have spent decades building, selling, and hiring at the world&rsquo;s top medical device companies.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Gagan Victor",
                role: "Co-Founder & Program Director",
                photo: "/assets/gagan_victor.jpg",
                bio: "Former leader at Pfizer, BMS, Medtronic India and Stryker, overseeing Cardiovascular and Surgical device portfolios. Transitioned from Medical Rep to Corporate MedTech Leader to full-time training, coaching, and mentoring to build India's next generation of MedTech-ready professionals.",
                tags: ["Ex-Pfizer, BMS, Medtronic & Stryker", "Career Coach", "Podcaster"],
              },
              {
                name: "Shilpi Babbar",
                role: "Co-Founder & Skills Enhancement Coach",
                photo: "/assets/shilpi_babbar.jpg",
                bio: "Co-founder and Skills Enhancement Coach at MedSkills Catalyst, with more than a decade of experience in coaching and career counselling, certified by ICBI-NABET. Shilpi specialises in stress management, emotional intelligence, and the interpersonal skills required to thrive in high-pressure MedTech corporate environments.",
                tags: ["ICBI-NABET Certified", "Skills Enhancement Coach", "11+ Years Experience"],
              },
              {
                name: "Dr. Vincent Keny, PhD",
                role: "Executive Coach & Leadership Mentor",
                photo: "/assets/vincent_keny.png",
                bio: "With over 25 years of global corporate leadership experience, Dr. Keny brings executive-grade coaching to MedSkills. An ICF Certified Coach and MIT Sloan alumnus, he works with candidates on behavioral orientation, executive communication, and the interpersonal dynamics that determine performance in high-stakes MedTech environments.",
                tags: ["Ex-Boston Scientific", "ICF Certified Coach", "MIT Sloan Alumnus"],
              },
            ].map((m, idx) => (
              <div key={idx} className="group rounded-msc-lg border border-brand-navy/[0.06] bg-surface p-6 shadow-msc-sm flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={m.photo}
                    alt={m.name}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-full object-cover object-center ring-2 ring-brand-blue/15"
                  />
                  <div>
                    <h3 className="font-display text-lg font-bold text-brand-navy leading-tight">{m.name}</h3>
                    <p className="text-[0.68rem] font-semibold text-brand-blue uppercase mt-1 tracking-wider leading-snug">{m.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {m.tags.map((t, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Bottom Registration Callout ── */}
      <section id="book-now" className="px-5 py-16 md:py-24 relative z-10 bg-brand-navy text-white text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue">
            <IconSeat className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Secure Your Seat Today
          </h2>
          <p className="text-lg leading-relaxed text-white/80 max-w-2xl mx-auto">
            Book the **MedTech Foundation Program** for a special campaign fee of **₹4,999** (Standard price: ~~₹29,999~~ · You save 83%). Secure your seat immediately through the official Razorpay payment page.
          </p>

          <div className="pt-4">
            <a
              href={PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center rounded-pill bg-white px-10 text-lg font-bold text-brand-navy shadow-msc-glow transition hover:bg-brand-pale"
            >
              Book Now — ₹4,999 securely →
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <IconShield className="h-4 w-4" /> Secured by Razorpay
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconReceipt className="h-4 w-4" /> Instant GST Invoice
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconLock className="h-4 w-4" /> 100% Secure Checkout
            </span>
          </div>
        </div>
      </section>

      {/* ── 6. FAQs Section ── */}
      <section className="px-5 py-16 md:py-24 relative z-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">FAQ</span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">
              Common Questions &amp; Concerns
            </h2>
          </div>

          <Card className="overflow-hidden border border-brand-navy/[0.05] shadow-msc-sm">
            <CardContent className="p-6 sm:p-8">
              <Accordion>
                <AccordionItem question="Is this program completely online?">
                  Yes, the foundation program is fully online with interactive live weekend classes and structured self-paced modules to fit your schedule.
                </AccordionItem>
                <AccordionItem question="Do you offer placement assistance?">
                  Yes, we provide 100% placement support, including resume styling, mock interviews with industry leaders, and direct referrals to top MedTech brands.
                </AccordionItem>
                <AccordionItem question="What happens if I miss a live session?">
                  All live sessions are recorded and uploaded to the student portal within a few hours, accompanied by study guides and assessments.
                </AccordionItem>
                <AccordionItem question="Will I get a certificate?">
                  Yes, upon successfully completing all modules and assessments, you will receive a verified MedSkills Catalyst Certificate of Competency.
                </AccordionItem>
                <AccordionItem question="What is your refund policy?">
                  Because you receive immediate access to our learning resources, mentorship, and community, programme fees are non-refundable. We encourage you to review the programme details before enrolling.
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="border-t border-brand-navy/10 bg-surface relative z-10">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
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
              <a href="/about-us.html" className="hover:text-brand-blue">About Us</a>
              <a href="/contact-us.html" className="hover:text-brand-blue">Contact Us</a>
              <a href="/privacy-policy.html" className="hover:text-brand-blue">Privacy Policy</a>
              <a href="/terms-of-use.html" className="hover:text-brand-blue">Terms of Use</a>
              <a href="/refund-policy.html" className="hover:text-brand-blue">Refund Policy</a>
              <a href="/cancellation-policy.html" className="hover:text-brand-blue">Cancellation Policy</a>
              <a href="/shipping-delivery.html" className="hover:text-brand-blue">Shipping &amp; Delivery</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
