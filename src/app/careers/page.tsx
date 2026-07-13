import { Metadata } from "next";
import Link from "next/link";
import { CareersNav } from "@/src/components/careers/CareersNav";
import { CareersFooter } from "@/src/components/careers/CareersFooter";
import { JOB_OPENINGS } from "@/src/data/jobs";

export const metadata: Metadata = {
  title: "Careers — MedSkills Catalyst",
  description: "Join the mission-driven team helping thousands of Life Sciences and Healthcare students build meaningful careers in MedTech.",
  openGraph: {
    title: "MedSkills Catalyst Careers",
    description: "Build the future of MedTech with us. Explore our open student internships and roles.",
    type: "website",
    images: [{ url: "/assets/careers_hero.png" }]
  }
};

export default function CareersPage() {
  return (
    <div className="bg-canvas min-h-screen flex flex-col font-body text-ink">
      <CareersNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 md:py-24 border-b border-ink/5">
        {/* Subtle grid pattern or backdrop gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,208,255,0.08),transparent_50%)] pointer-events-none" />

        <div className="mx-auto max-w-[1200px] px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left text column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-pale border border-teal-mid/10 px-3 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-teal-mid mb-6">
                🚀 Join our team
              </span>
              <h1 className="font-display text-[2.5rem] leading-[1.1] sm:text-[3.25rem] font-bold tracking-tight text-teal-deep mb-6">
                Build the Future of <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-teal-mid to-teal-leg bg-clip-text text-transparent">MedTech With Us</span>
              </h1>
              <p className="text-[1.05rem] md:text-[1.15rem] leading-relaxed text-ink/70 max-w-xl mb-8">
                Join a mission-driven team helping thousands of Life Sciences and Healthcare students build meaningful careers in MedTech.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#positions"
                  className="inline-flex items-center justify-center rounded-msc bg-teal-mid px-6 py-3 font-body text-[0.95rem] font-bold text-white tracking-[-0.005em] transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(10,42,67,0.15)]"
                >
                  Explore Open Positions
                </a>
                <a
                  href="#why-join"
                  className="inline-flex items-center justify-center rounded-msc border border-ink/15 bg-white px-6 py-3 font-body text-[0.95rem] font-bold text-ink/80 tracking-[-0.005em] transition-all duration-200 hover:bg-canvas hover:text-ink hover:-translate-y-px"
                >
                  Learn About Our Mission
                </a>
              </div>
            </div>

            {/* Right illustration column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[480px] lg:max-w-none rounded-msc-lg border border-teal-mid/15 shadow-msc-md overflow-hidden bg-white/50 p-2 backdrop-blur-sm">
                <img
                  src="/assets/careers_hero.png"
                  alt="Students collaborating on healthcare technology careers"
                  className="w-full h-auto object-contain rounded-msc-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section id="why-join" className="py-20 md:py-24 bg-canvas border-b border-ink/5">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-teal-mid">
              Values & Culture
            </span>
            <h2 className="font-display text-[2rem] sm:text-[2.5rem] font-bold tracking-tight text-teal-deep mt-3 mb-4">
              Why Work With MedSkills Catalyst?
            </h2>
            <p className="text-[1rem] leading-relaxed text-ink/65">
              We believe in granting real ownership, direct industry accessibility, and fostering structured career acceleration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "💡",
                title: "Real Startup Experience",
                desc: "Learn by building alongside an early-stage startup shaping the future of MedTech education."
              },
              {
                icon: "🤝",
                title: "Industry Mentorship",
                desc: "Learn directly from professionals working across MedTech and Healthcare."
              },
              {
                icon: "🔑",
                title: "Ownership",
                desc: "Own real projects that create measurable impact from day one."
              },
              {
                icon: "📈",
                title: "Career Growth",
                desc: "Build leadership, communication, marketing, and business skills."
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm hover:shadow-msc-md transition-shadow duration-300 flex flex-col items-start text-left"
              >
                <div className="h-12 w-12 rounded-msc bg-teal-pale flex items-center justify-center text-xl mb-6 shadow-inner">
                  {card.icon}
                </div>
                <h3 className="font-display text-[1.15rem] font-bold text-teal-deep mb-3">
                  {card.title}
                </h3>
                <p className="text-[0.875rem] leading-relaxed text-ink/60">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-20 md:py-24 bg-white">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-ink/8 pb-8 mb-12 gap-4">
            <div className="text-left">
              <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-teal-mid">
                Join Us
              </span>
              <h2 className="font-display text-[2rem] sm:text-[2.5rem] font-bold tracking-tight text-teal-deep mt-3">
                Open Opportunities
              </h2>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[0.9rem] text-ink/60 font-semibold">
                Showing {JOB_OPENINGS.filter(j => j.status === 'Open').length} available roles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {JOB_OPENINGS.map((job) => (
              <div
                key={job.slug}
                className="bg-white border border-ink/10 rounded-msc-lg p-6 md:p-8 hover:border-teal-mid/30 shadow-msc-sm hover:shadow-msc-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap gap-2.5 items-center mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-pale text-teal-mid font-semibold text-[0.72rem] tracking-wider uppercase border border-teal-mid/5">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-ink/5 text-ink/60 font-semibold text-[0.72rem] tracking-wider uppercase">
                      🕒 {job.duration}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald/10 text-teal-mid font-semibold text-[0.72rem] tracking-wider uppercase">
                      📍 {job.location}
                    </span>
                  </div>
                  <h3 className="font-display text-[1.4rem] md:text-[1.6rem] font-bold text-teal-deep hover:text-teal-mid transition-colors">
                    <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[0.825rem] text-ink/50">
                    <span><strong>Type:</strong> {job.type}</span>
                    <span>•</span>
                    <span className="text-red-500"><strong>Deadline:</strong> {job.deadline}</span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex sm:items-center justify-start md:justify-end shrink-0">
                  <Link
                    href={`/careers/${job.slug}`}
                    className="w-full md:w-auto text-center inline-flex items-center justify-center rounded-msc bg-teal-mid px-6 py-3 font-body text-[0.9rem] font-bold text-white transition-all duration-200 hover:bg-emerald-dark hover:shadow-[0_6px_20px_rgba(10,42,67,0.12)]"
                  >
                    Apply Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CareersFooter />
    </div>
  );
}
