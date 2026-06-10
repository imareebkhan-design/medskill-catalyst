import { Section } from "./ui/Section";
import { WEBINAR } from "@/lib/webinar.config";
import { TrackedCTA } from "./ui/TrackedCTA";

const includes = [
  "The 6 highest-paying MedTech roles for switchers",
  "The interview questions Stryker / Medtronic-tier companies ask",
  "A pharma-to-device resume rewrite checklist",
  "Salary bands by city, role, and company size",
];

export function FreeResources() {
  return (
    <Section id="free-resources" eyebrow="Free with your seat">
      <div className="grid items-center gap-10 rounded-msc-lg border border-ink/8 bg-surface p-7 shadow-msc-sm sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-mid">
            Every registrant gets
          </p>
          <h2 className="mt-2 font-display font-bold leading-[1.15] tracking-[-0.02em] [font-size:clamp(1.5rem,3vw,2.2rem)] text-teal-deep">
            {WEBINAR.leadMagnetTitle}
          </h2>
          <ul className="mt-5 space-y-2.5">
            {includes.map((t) => (
              <li key={t} className="flex gap-3 text-ink/75">
                <span className="mt-1 text-emerald">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <TrackedCTA
            label="Register to get the guide"
            location="free_resources"
            className="mt-7"
          >
            Register &amp; get the guide →
          </TrackedCTA>
          <p className="mt-3 text-sm text-ink/50">
            The download link unlocks on the thank-you page after you register.
          </p>
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          {/* 3D Physical Book Mockup Cover */}
          <div className="relative w-[180px] h-[245px] sm:w-[200px] sm:h-[270px] bg-gradient-to-br from-teal-deep via-teal-deep to-teal-mid rounded-r-lg shadow-[12px_16px_32px_rgba(10,34,67,0.35)] border-r-4 border-teal-leg/20 flex flex-col justify-between p-5 overflow-hidden transition-transform duration-300 hover:scale-[1.03] select-none">
            {/* Spine shadow overlay */}
            <div 
              aria-hidden
              className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-black/20 via-white/5 to-transparent" 
            />
            {/* Book contents */}
            <div>
              <span className="inline-block text-[0.6rem] font-extrabold uppercase tracking-widest bg-teal-leg/25 text-teal-leg px-2 py-0.5 rounded border border-teal-leg/10">
                HANDBOOK
              </span>
              <h4 className="mt-4 font-body font-bold text-white text-base sm:text-lg leading-tight tracking-tight">
                MedTech Career
                <br />
                Transition Guide
              </h4>
            </div>
            
            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <span className="text-[0.62rem] font-bold text-teal-leg tracking-wider uppercase">
                2026 Edition
              </span>
              <span className="text-[0.62rem] font-bold text-white/50 tracking-wider">
                28 Pages
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
