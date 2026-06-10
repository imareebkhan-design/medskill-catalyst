import { Section } from "./ui/Section";

const forYou = [
  "Pharma medical representatives wanting a higher-paying lane",
  "B.Pharm / M.Pharm and life-science graduates entering the job market",
  "Biotech, lab, or clinical-tech professionals eyeing device sales",
  "Final-year students exploring MedTech before they graduate",
];

const notForYou = [
  "People looking for a guaranteed job with zero effort",
  "Anyone expecting a placement without building real skills",
  "Those already senior in MedTech sales (this is foundational)",
];

export function WhoThisIsFor() {
  return (
    <Section
      id="who-this-is-for"
      tone="pale"
      eyebrow="Is this you?"
      title="Who this masterclass is for"
    >
      <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
        <div className="rounded-msc-lg border border-emerald/30 bg-surface p-6">
          <h3 className="font-display text-[1.25rem] font-bold leading-[1.3] tracking-[-0.01em] text-teal-deep">
            ✓ A strong fit if you&apos;re…
          </h3>
          <ul className="mt-4 space-y-3">
            {forYou.map((t) => (
              <li key={t} className="flex gap-3 text-ink/75">
                <span className="mt-1 text-emerald">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-msc-lg border border-ink/10 bg-surface p-6">
          <h3 className="font-display text-[1.25rem] font-bold leading-[1.3] tracking-[-0.01em] text-ink/60">
            Probably not for you if…
          </h3>
          <ul className="mt-4 space-y-3">
            {notForYou.map((t) => (
              <li key={t} className="flex gap-3 text-ink/60">
                <span className="mt-1 text-ink/40">–</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
