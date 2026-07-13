import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareersNav } from "@/src/components/careers/CareersNav";
import { CareersFooter } from "@/src/components/careers/CareersFooter";
import { ApplicationForm } from "@/src/components/careers/ApplicationForm";
import { JOB_OPENINGS } from "@/src/data/jobs";
import { JobDetailClient } from "@/src/components/careers/JobDetailClient";

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

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-body text-ink">
      <CareersNav />

      {/* Hero Section */}
      <section className="bg-white border-b border-ink/5 py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,88,158,0.06),transparent_50%)] pointer-events-none" />
        <div className="mx-auto max-w-[1200px] px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-pale border border-teal-mid/10 px-3.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-teal-mid mb-6">
                🔥 Now Hiring
              </span>
              <h1 className="font-display text-[2.25rem] sm:text-[3rem] font-bold tracking-tight text-teal-deep leading-tight mb-4">
                {job.title}
              </h1>
              <p className="text-[1rem] leading-relaxed text-ink/75 max-w-xl mb-8">
                {job.subtitle}
              </p>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-canvas border border-ink/8 rounded-full text-[0.8rem] font-semibold text-ink/70">
                  📍 {job.location}
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-canvas border border-ink/8 rounded-full text-[0.8rem] font-semibold text-ink/70">
                  🕒 {job.duration}
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-canvas border border-ink/8 rounded-full text-[0.8rem] font-semibold text-ink/70">
                  💼 {job.department}
                </div>
              </div>

              <a
                href="#apply-form-section"
                className="inline-flex items-center justify-center rounded-msc bg-teal-mid px-6 py-3 font-body text-[0.95rem] font-bold text-white tracking-[-0.005em] transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(10,42,67,0.15)]"
              >
                Apply Now →
              </a>
            </div>

            {/* Right Col (Illustration) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[400px] lg:max-w-none rounded-msc-lg border border-teal-mid/15 shadow-msc-md overflow-hidden bg-white p-2">
                <img
                  src={job.heroImage}
                  alt={job.title}
                  className="w-full h-auto object-contain rounded-msc-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body Grid */}
      <section className="py-12 md:py-16 bg-canvas flex-1">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Client Wrapper for Collapsible Details & Accordions */}
              <JobDetailClient job={job} />

            </div>

            {/* Right Sticky Sidebar Brief Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div className="bg-white border border-ink/8 p-6 rounded-msc-lg shadow-msc-sm text-left">
                <h4 className="font-display text-[1.15rem] font-bold text-teal-deep border-b border-ink/5 pb-3 mb-4">
                  Job Brief
                </h4>
                <div className="space-y-3.5 text-[0.875rem] text-ink/75">
                  <div className="flex justify-between">
                    <span className="text-ink/40 font-medium">Department</span>
                    <span className="font-bold text-teal-deep">{job.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/40 font-medium">Location</span>
                    <span className="font-bold text-teal-deep">{job.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/40 font-medium">Position Type</span>
                    <span className="font-bold text-teal-deep">{job.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/40 font-medium">Duration</span>
                    <span className="font-bold text-teal-deep">{job.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/40 font-medium">Deadline</span>
                    <span className="font-bold text-red-500">{job.deadline}</span>
                  </div>
                </div>

                <a
                  href="#apply-form-section"
                  className="mt-6 w-full text-center inline-flex items-center justify-center rounded-msc bg-teal-mid px-5 py-3 font-body text-[0.9rem] font-bold text-white transition-all duration-200 hover:bg-emerald-dark"
                >
                  Apply for this role
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="apply-form-section" className="py-16 md:py-24 bg-white border-t border-ink/5">
        <div className="mx-auto max-w-[1200px] px-6">
          <ApplicationForm jobSlug={job.slug} jobTitle={job.title} />
        </div>
      </section>

      <CareersFooter />
    </div>
  );
}
