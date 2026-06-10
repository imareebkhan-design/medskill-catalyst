import { Section } from "./ui/Section";

const benefits = [
  {
    title: "Built for switchers, not insiders",
    body: "You don't need prior device experience. The session is designed for pharma reps, life-science grads, and students starting from zero in MedTech.",
  },
  {
    title: "Real hiring signal",
    body: "What hiring managers at global device companies actually screen for — straight from people who've sat on the other side of the table.",
  },
  {
    title: "A plan you can act on Monday",
    body: "You leave with concrete next steps mapped to your background — not generic motivation.",
  },
  {
    title: "Live Q&A",
    body: "Ask your specific situation out loud and get a direct answer, not a brochure.",
  },
];

export function Benefits() {
  return (
    <Section
      id="benefits"
      eyebrow="Why attend"
      title="90 minutes that change how you approach the switch"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-msc-lg border border-ink/8 bg-surface p-6 shadow-msc-sm"
          >
            <h3 className="font-display text-[1.25rem] font-bold leading-[1.3] tracking-[-0.01em] text-teal-deep">
              {b.title}
            </h3>
            <p className="mt-2 leading-relaxed text-ink/70">{b.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
