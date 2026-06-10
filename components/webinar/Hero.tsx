import { WEBINAR } from "@/lib/webinar.config";
import { TrackedCTA } from "./ui/TrackedCTA";

const meta = [
  { label: "Date",  value: WEBINAR.dateLabel },
  { label: "Time",  value: `${WEBINAR.timeLabel} · ${WEBINAR.durationLabel}` },
  { label: "Where", value: WEBINAR.platformLabel },
  { label: "Cost",  value: WEBINAR.price },
];

export function Hero() {
  return (
    // Match the live site hero card: radial-gradient bg, generous padding, grid layout
    <section className="relative overflow-hidden bg-teal-deep px-5 pb-[clamp(2rem,5vw,4rem)] pt-[clamp(2.5rem,6vw,4.5rem)] text-white sm:px-8">
      {/* radial glow matching hero-card background-image on live site */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[60%] w-[50%] bg-[radial-gradient(circle_at_100%_150%,rgba(0,88,158,0.18)_15%,transparent_50%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          {/* .pill--brand matching the hero-pill on the live site */}
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-teal-pale/10 px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.03em] text-teal-pale">
            ⚕ Free live masterclass
          </span>
          {/* .t-display: clamp(2.5rem,6.8vw,5rem), 700, line-height 1.06, tracking -.03em */}
          <h1 className="mt-7 font-display font-bold leading-[1.06] tracking-[-0.03em] text-white [font-size:clamp(2.2rem,5.2vw,3.8rem)]">
            {WEBINAR.title}
          </h1>
          {/* .hero-sub: 1.15rem, line-height 1.75, white/70 */}
          <p className="mt-6 max-w-xl text-[1.15rem] leading-[1.75] text-white/70">
            {WEBINAR.subtitle}
          </p>

          {/* Match .hero-stats: flex row with dividers, stat-num in display font */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            {meta.map((m, i) => (
              <div key={m.label} className="flex items-center gap-8">
                <div className="flex flex-col">
                  {/* .hero-stat-label */}
                  <span className="text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-white/50">
                    {m.label}
                  </span>
                  {/* .hero-stat-num: display font, large, cyan */}
                  <span className="font-display text-[1.6rem] font-bold leading-none tracking-[-0.02em] text-teal-leg">
                    {m.value}
                  </span>
                </div>
                {i < meta.length - 1 && (
                  <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TrackedCTA
              label="Reserve my free seat"
              location="hero"
              className="w-full sm:w-auto"
            >
              Reserve my free seat →
            </TrackedCTA>
            <p className="text-sm text-white/55">
              No payment. Zoom link sent on WhatsApp &amp; email.
            </p>
          </div>
        </div>

        {/* Right column: honest "what you get" card — no fabricated counts */}
        <div className="rounded-msc-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-leg">
            In this session you&apos;ll walk away with
          </p>
          <ul className="mt-4 space-y-3 text-[15px] text-white/85">
            {[
              "A clear map of which MedTech roles hire career-switchers",
              "A resume angle that reframes your current experience",
              "The interview questions device companies actually ask",
              "Your specific next step — whatever your background",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1 text-teal-leg">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
            {/* TODO [PLACEHOLDER: real host name + verifiable title] */}
            Hosted by the MedSkills Catalyst faculty.
          </p>
        </div>
      </div>
    </section>
  );
}
