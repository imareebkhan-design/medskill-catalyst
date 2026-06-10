import { Section } from "./ui/Section";

const agenda = [
  {
    time: "Part 1",
    title: "The MedTech Map",
    body: "Which segments (ortho, cardio, surgical, diagnostics) are hiring switchers right now, and the roles that don't need a device background to enter.",
  },
  {
    time: "Part 2",
    title: "The Resume Pivot",
    body: "How to reframe pharma / clinical / sales experience into a profile a device recruiter shortlists — with the exact language to use.",
  },
  {
    time: "Part 3",
    title: "Interview & Objections",
    body: "The questions companies probe on, how to handle 'you have no device experience', and a live walkthrough of a real interview scenario.",
  },
  {
    time: "Part 4",
    title: "Live Q&A",
    body: "Bring your background and your blockers. Get a specific answer to your situation.",
  },
];

export function WhatYoullLearn() {
  return (
    <Section
      id="what-youll-learn"
      tone="pale"
      eyebrow="The agenda"
      title="What we'll actually cover"
    >
      <ol className="mx-auto max-w-3xl space-y-4">
        {agenda.map((a, i) => (
          <li
            key={a.title}
            className="flex gap-5 rounded-msc-lg border border-teal-deep/10 bg-surface p-5 sm:p-6"
          >
            <div
              aria-hidden
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-teal-deep font-display text-lg font-semibold text-white"
            >
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-mid">
                {a.time}
              </p>
              <h3 className="font-display text-[1.25rem] font-bold leading-[1.3] tracking-[-0.01em] text-teal-deep">
                {a.title}
              </h3>
              <p className="mt-1 leading-relaxed text-ink/70">{a.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
