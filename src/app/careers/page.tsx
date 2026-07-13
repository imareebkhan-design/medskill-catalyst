import { Metadata } from "next";
import Link from "next/link";
import { CareersNav } from "@/src/components/careers/CareersNav";
import { CareersFooter } from "@/src/components/careers/CareersFooter";
import { JOB_OPENINGS } from "@/src/data/jobs";
import {
  BtnChip,
  btnCompact,
  btnPrimary,
  btnSecondary,
  heroCardClass,
  heroCardTexture,
  IconBriefcase,
  IconCalendar,
  IconClock,
  IconKey,
  IconMapPin,
  IconPlus,
  IconTarget,
  IconTrendingUp,
  IconUsers,
} from "@/src/components/careers/ui";

export const metadata: Metadata = {
  title: "Careers — MedSkills Catalyst",
  description: "Join the mission-driven team helping thousands of Life Sciences and Healthcare students build meaningful careers in MedTech.",
  openGraph: {
    title: "MedSkills Catalyst Careers",
    description: "Build the future of MedTech with us. Explore our open student internships and roles.",
    type: "website",
    // TODO(asset): replace with a real branded OG photo once shot.
    images: [{ url: "/brand/logo/MedSkills-Catalyst_Logo.png" }]
  }
};

const VALUES = [
  {
    icon: IconTarget,
    title: "Real Impact",
    desc: "You won't be writing abstract reports or doing busywork. Every campaign you launch, event you coordinate, or piece of content you write directly helps a student discover a career path they didn't know existed."
  },
  {
    icon: IconUsers,
    title: "Direct Mentorship",
    desc: "Work alongside leaders who have built careers at global companies like Stryker, Johnson & Johnson, and Medtronic. You'll get direct feedback, regular check-ins, and active career guidance."
  },
  {
    icon: IconKey,
    title: "True Ownership",
    desc: "We don't micromanage. You own your region, your campus, or your channel. If you have an idea for a campaign or event, you run with it from start to finish."
  },
  {
    icon: IconTrendingUp,
    title: "Skill-First Growth",
    desc: "Learn how to build real communities, write copy that actually converts, coordinate events, and pitch ideas. These are the skills that make you highly hireable, no matter where you go next."
  }
];

// TODO(asset): swap text names for official logo files once added to /public/brand.
const TRUST_COMPANIES = ["Stryker", "Johnson & Johnson", "Medtronic", "Abbott"];

export default function CareersPage() {
  const openRoles = JOB_OPENINGS.filter(j => j.status === "Open");

  return (
    <div className="bg-canvas min-h-screen flex flex-col font-body text-ink">
      <CareersNav />

      {/* Hero — homepage .hero-card treatment: navy, 32px radius, grid texture */}
      <section className="pt-8 pb-4 md:pt-12 md:pb-6">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className={heroCardClass} style={heroCardTexture}>
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-14 px-8 py-10 md:px-14 md:py-14">
              {/* Left text column */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                <span className="mb-6 inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/10 px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-teal-leg">
                  <IconPlus className="h-3 w-3" />
                  Join the team
                </span>
                <h1 className="font-display text-[2.4rem] leading-[1.08] sm:text-[3rem] lg:text-[3.5rem] font-bold tracking-[-0.01em] text-white mb-6">
                  Run MedTech on your campus. Get mentored by the people who hire for it.
                </h1>
                <p className="text-[1.02rem] md:text-[1.1rem] leading-relaxed text-white/75 max-w-xl mb-9">
                  Most education platforms focus on video views and course sales. We focus on getting
                  life-science graduates and healthcare professionals into real jobs at global MedTech brands.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#positions" className={btnPrimary}>
                    View roles <BtnChip />
                  </a>
                  <a href="#why-join" className={btnSecondary}>
                    Learn about our mission
                  </a>
                </div>
              </div>

              {/* Right visual — founder photo card.
                  TODO(asset): replace with the founder welcome video card once recorded. */}
              <div className="lg:col-span-5">
                <figure className="overflow-hidden rounded-msc-lg border border-white/10 bg-white/[0.04] shadow-msc-lg">
                  <img
                    src="/assets/gagan_victor.png"
                    alt="Gagan Victor, Co-Founder and Program Director of MedSkills Catalyst"
                    className="w-full h-auto object-cover"
                    width={480}
                    height={480}
                  />
                  <figcaption className="border-t border-white/10 px-5 py-4">
                    <span className="block font-display text-[1rem] font-bold text-white">Gagan Victor</span>
                    <span className="block text-[0.8rem] text-white/60">
                      Co-Founder &amp; Program Director · Former Pfizer, BMS, Medtronic &amp; Stryker
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 px-4 py-8 md:py-10">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Learn from leaders who built careers at
            </span>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {TRUST_COMPANIES.map(name => (
                <li key={name} className="font-body text-[0.9rem] font-bold uppercase tracking-[0.08em] text-teal-deep/50">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section id="why-join" className="py-16 md:py-20 bg-canvas border-b border-[rgba(10,42,67,0.08)]">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-teal-mid">
              Values &amp; Culture
            </span>
            <h2 className="font-display text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-teal-deep mt-3 mb-4">
              Why Work With MedSkills Catalyst?
            </h2>
            <p className="text-[1rem] leading-relaxed text-muted">
              You own your campus. You learn from people who&apos;ve hired at Stryker and J&amp;J.
              You build skills that actually get you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((card) => (
              <div
                key={card.title}
                className="bg-surface border border-[rgba(10,42,67,0.08)] p-8 rounded-msc-lg shadow-msc-sm hover:shadow-msc-md hover:-translate-y-0.5 hover:border-teal-mid/15 transition-all duration-300 ease-out flex flex-col items-start text-left"
              >
                <div className="h-12 w-12 rounded-msc-md bg-teal-pale text-teal-mid flex items-center justify-center mb-6">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-[1.2rem] font-bold text-teal-deep mb-3">
                  {card.title}
                </h3>
                <p className="text-[0.875rem] leading-relaxed text-muted">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section id="positions" className="py-16 md:py-20 bg-surface">
        <div className="mx-auto max-w-[860px] px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[rgba(10,42,67,0.08)] pb-8 mb-10 gap-4">
            <div className="text-left">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-teal-mid">
                Join Us
              </span>
              <h2 className="font-display text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-teal-deep mt-3">
                Open Opportunities
              </h2>
            </div>
            <p className="text-[0.85rem] font-bold text-teal-mid bg-teal-pale border border-teal-mid/10 px-4 py-1.5 rounded-pill inline-block self-start md:self-auto">
              {openRoles.length} open role{openRoles.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {openRoles.map((job) => (
              <div
                key={job.slug}
                className="bg-surface border border-[rgba(10,42,67,0.08)] rounded-msc-lg p-6 md:p-8 hover:border-teal-mid/20 shadow-msc-sm hover:shadow-msc-md hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap gap-2.5 items-center mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-teal-pale text-teal-mid font-bold text-[0.72rem] tracking-wider uppercase">
                      <IconBriefcase className="h-3.5 w-3.5" />
                      {job.department}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-teal-pale text-teal-mid font-bold text-[0.72rem] tracking-wider uppercase">
                      <IconClock className="h-3.5 w-3.5" />
                      {job.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-teal-pale text-teal-mid font-bold text-[0.72rem] tracking-wider uppercase">
                      <IconMapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                  </div>
                  <h3 className="font-display text-[1.45rem] md:text-[1.65rem] font-bold text-teal-deep hover:text-teal-mid transition-colors">
                    <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[0.825rem] text-muted">
                    <span><strong className="font-bold text-teal-deep">Type:</strong> {job.type}</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-warning">
                      <IconCalendar className="h-3.5 w-3.5" />
                      Apply by {job.deadline}
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex sm:items-center justify-start md:justify-end shrink-0">
                  <Link href={`/careers/${job.slug}`} className={`${btnCompact} w-full md:w-auto`}>
                    View role <BtnChip />
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
