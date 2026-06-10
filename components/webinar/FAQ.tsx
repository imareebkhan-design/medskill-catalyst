import { Section } from "./ui/Section";

const faqs = [
  {
    q: "Is the masterclass really free?",
    a: "Yes — it's a free live session. There's no payment to attend, and no obligation to join the paid programme afterward.",
  },
  {
    q: "Do I need a medical-device background?",
    a: "No. The entire session is built for people coming from pharma, life sciences, or general sales who have no prior device experience.",
  },
  {
    q: "I can't attend live — will there be a recording?",
    a: "Register anyway. If we share a recording, the link goes to registrants on WhatsApp and email. Attending live is the only way to ask your question in the Q&A.",
  },
  {
    q: "How do I get the joining link?",
    a: "After you register, the Zoom link and reminders are sent to your WhatsApp number and email. You can also add the session to your calendar in one tap.",
  },
  {
    q: "Is this a sales pitch for the paid course?",
    a: "We'll mention the programme at the end, but the 90 minutes are genuinely useful on their own. You decide what to do with what you learn.",
  },
  {
    q: "What do I need to join?",
    a: "A phone or laptop with internet and the free Zoom app. That's it.",
  },
];

export function FAQ() {
  return (
    <Section id="faq" eyebrow="Questions" title="Answers before you ask">
      <div className="mx-auto max-w-3xl divide-y divide-ink/10">
        {faqs.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.15rem] font-bold tracking-[-0.01em] text-teal-deep">
              {f.q}
              <span
                aria-hidden
                className="text-2xl font-light text-teal-mid transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 leading-relaxed text-ink/70">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
