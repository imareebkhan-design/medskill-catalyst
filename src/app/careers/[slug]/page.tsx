import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareersNav } from "@/src/components/careers/CareersNav";
import { CareersFooter } from "@/src/components/careers/CareersFooter";
import { ApplicationForm } from "@/src/components/careers/ApplicationForm";
import { JOB_OPENINGS } from "@/src/data/jobs";
import { JobSections, JobTimeline } from "@/src/components/careers/JobSections";
import { JobFaq } from "@/src/components/careers/JobFaq";
import { FounderTrust } from "@/src/components/careers/FounderTrust";
import {
  BtnChip,
  btnCompact,
  btnPrimary,
  heroCardClass,
  heroCardTexture,
  IconBriefcase,
  IconCalendar,
  IconClock,
  IconMapPin,
} from "@/src/components/careers/ui";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = JOB_OPENINGS.find(j => j.slug === slug);
  if (!job) return {};

  return {
    title: `${job.title} — Careers | MedSkills Catalyst`,
    description: job.subtitle,
    openGraph: {
      title: `${job.title} — MedSkills Catalyst`,
      description: job.subtitle,
      images: [{ url: job.heroImage }]
    }
  };
}

export async function generateStaticParams() {
  return JOB_OPENINGS.map(j => ({ slug: j.slug }));
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const job = JOB_OPENINGS.find(j => j.slug === slug);
  if (!job) {
    notFound();
  }

  const metaChips = [
    { icon: IconMapPin, label: job.location },
    { icon: IconClock, label: job.duration },
    { icon: IconBriefcase, label: job.department },
  ];

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-body text-ink pb-20 lg:pb-0">
      <CareersNav />

      {/* Hero — homepage .hero-card treatment */}
      <section className="pt-8 pb-10 md:pt-12 md:pb-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className={heroCardClass} style={heroCardTexture}>
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-14 px-8 py-10 md:px-14 md:py-14">
              {/* Left copy */}
              <div className="lg:col-span-7 text-left">
                <span className="mb-6 inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-teal-leg">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-leg" />
                  Now hiring
                </span>
                <h1 className="font-display text-[2.2rem] sm:text-[2.8rem] font-bold tracking-[-0.01em] text-white leading-[1.12] mb-5">
                  {job.title}
                </h1>
                <p className="text-[1.02rem] leading-relaxed text-white/75 max-w-xl mb-7">
                  {job.subtitle}
                </p>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-3 mb-9">
                  {metaChips.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.8rem] font-bold text-white/90"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  ))}
                </div>

                <a href="#apply-form-section" className={btnPrimary}>
                  Apply <BtnChip />
                </a>
              </div>

              {/* Right visual — founder photo card.
                  TODO(asset): replace with a real program photo or founder video card. */}
              <div className="lg:col-span-5">
                <figure className="overflow-hidden rounded-msc-lg border border-white/10 bg-white/[0.04] shadow-msc-lg">
                  <img
                    src="/assets/shilpi_babbar.jpg"
                    alt="Shilpi Babbar, Co-Founder and Skills Enhancement Coach at MedSkills Catalyst"
                    className="w-full h-auto max-h-[400px] object-cover object-top"
                    width={480}
                    height={400}
                  />
                  <figcaption className="border-t border-white/10 px-5 py-4">
                    <span className="block font-display text-[1rem] font-bold text-white">Shilpi Babbar</span>
                    <span className="block text-[0.8rem] text-white/60">
                      Co-Founder &amp; Skills Enhancement Coach · Your mentor through the program
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column area: core sections + sticky Job Brief. The sticky column
          only spans these sections, so it never leaves a tall empty rail. */}
      <section className="pb-12 md:pb-16 flex-1">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8">
              <JobSections job={job} />
            </div>

            {/* Sticky Job Brief */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-surface border border-[rgba(10,42,67,0.08)] p-6 md:p-8 rounded-msc-lg shadow-msc-sm text-left">
                <h2 className="font-display text-[1.2rem] font-bold text-teal-deep border-b border-[rgba(10,42,67,0.08)] pb-3 mb-4">
                  Job Brief
                </h2>
                <dl className="space-y-3.5 text-[0.875rem]">
                  {[
                    ["Department", job.department],
                    ["Location", job.location],
                    ["Position Type", job.type],
                    ["Duration", job.duration],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted font-medium">{label}</dt>
                      <dd className="font-bold text-teal-deep text-right">{value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted font-medium">Deadline</dt>
                    <dd className="inline-flex items-center gap-1.5 font-bold text-warning text-right">
                      <IconCalendar className="h-3.5 w-3.5" />
                      {job.deadline}
                    </dd>
                  </div>
                </dl>

                <a href="#apply-form-section" className={`${btnCompact} mt-6 w-full`}>
                  Apply <BtnChip />
                </a>
                <p className="mt-3 text-center text-[0.75rem] text-muted">
                  Takes ~3 minutes. We reply on WhatsApp within a few days.
                </p>
              </div>
            </aside>
          </div>

          {/* Full-width modules below the two-column area */}
          <div className="mt-12 space-y-12">
            <FounderTrust />
            <JobTimeline job={job} />
            <JobFaq faqs={job.faqs} />
          </div>
        </div>
      </section>

      {/* Application form — light surface */}
      <section id="apply-form-section" className="py-16 md:py-20 bg-surface border-t border-[rgba(10,42,67,0.08)]">
        <div className="mx-auto max-w-[1200px] px-6">
          <ApplicationForm jobSlug={job.slug} jobTitle={job.title} />
        </div>
      </section>

      <CareersFooter />

      {/* Mobile persistent apply bar */}
      <div className="fixed inset-x-0 bottom-0 z-[800] border-t border-[rgba(10,42,67,0.08)] bg-white/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="block truncate text-[0.8rem] font-bold text-teal-deep">{job.title}</span>
            <span className="block text-[0.7rem] font-semibold text-warning">Apply by {job.deadline}</span>
          </div>
          <a
            href="#apply-form-section"
            className="inline-flex shrink-0 items-center justify-center rounded-pill bg-teal-mid px-6 py-3 font-body text-[0.875rem] font-bold text-white shadow-msc-glow transition-colors hover:bg-emerald-dark"
          >
            Apply
          </a>
        </div>
      </div>
    </div>
  );
}
