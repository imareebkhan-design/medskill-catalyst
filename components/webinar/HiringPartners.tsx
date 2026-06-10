import { Section } from "./ui/Section";

const partners = [
  "Stryker",
  "Medtronic",
  "J&J MedTech",
  "Boston Scientific",
  "Abbott",
  "Becton Dickinson",
  "Siemens Healthineers",
  "Smith & Nephew",
  "Zimmer Biomet",
  "Baxter",
  "GE Healthcare",
];

export function HiringPartners() {
  return (
    <section className="bg-canvas border-y border-ink/5 py-12 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-ink/45">
          CURRICULUM TARGETS & MENTOR BACKGROUNDS
        </p>
        <h3 className="mt-2 font-display text-[1.2rem] font-bold tracking-tight text-teal-deep sm:text-xl">
          Preparing you for roles at MedTech industry leaders
        </h3>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {partners.map((p) => (
            <span
              key={p}
              className="inline-block rounded-msc border border-ink/8 bg-surface px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-teal-deep shadow-sm transition-colors duration-200 hover:border-ink/20"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
