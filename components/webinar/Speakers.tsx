import { Section } from "./ui/Section";

/**
 * SPEAKERS — fill with REAL, verifiable people only.
 * Each `photo` should be a real headshot in /public. Do not invent
 * titles or companies. If a claim ("Ex-Medtronic") can't be backed up,
 * soften it ("MedTech sales background") rather than fabricate.
 *
 * TODO [PLACEHOLDER]: Replace both speaker entries with real, confirmed details.
 */
interface Speaker {
  name: string;
  role: string;
  bio: string;
  photo?: string; // e.g. "/assets/gagan_victor.png"
  tags: string[];
}

const speakers: Speaker[] = [
  {
    name: "Gagan Victor",
    role: "Programme Director & Lead Mentor",
    bio: "Former Regional Sales Manager at Medtronic India, overseeing cardiovascular and surgical device portfolios across South India. Transitioned from corporate MedTech leadership to full-time training to build India's next generation of medical device professionals.",
    photo: "/assets/gagan_victor.png",
    tags: ["Ex-Medtronic", "Sales Strategy", "Interview Prep"],
  },
  {
    name: "Shilpi Babbar",
    role: "Co-founder & Skills Enhancement Coach",
    bio: "Co-founder and Skills Enhancement Coach at MedSkills Catalyst. Specialized in student career counseling, stress management, and emotional intelligence, with over 11 years of experience teaching and mentoring across Delhi NCR's premier institutions.",
    photo: "/assets/shilpi_babbar.jpg",
    tags: ["Co-founder", "Career Counseling", "Student Operations"],
  },
  {
    name: "Dr. Vincent Keny, PhD",
    role: "Executive Coach & Leadership Mentor",
    bio: "With over 25 years of global corporate experience driving business and personal excellence, Dr. Keny specializes in Spiritual & Emotional Business Intelligence, helping candidates master emotional resilience, interpersonal communication, and high-stakes MedTech corporate dynamics.",
    photo: "/assets/vincent_keny.png",
    tags: ["Ex-Boston Scientific", "ICF Coach", "Leadership Development"],
  },
];

function Initials({ name }: { name: string }) {
  const letters = name
    .replace(/\[.*?\]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-teal-pale font-display text-xl font-semibold text-teal-deep">
      {letters || "MS"}
    </div>
  );
}

export function Speakers() {
  return (
    <Section
      id="speakers"
      tone="dark"
      eyebrow="Who's teaching"
      title="Taught by people who've done the job"
      subtitle="Every speaker has worked in MedTech sales — not academics talking theory."
    >
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3">
        {speakers.map((s, i) => (
          <div
            key={i}
            className="rounded-msc-lg border border-white/10 bg-white/5 p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-4">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="h-16 w-16 flex-none rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <Initials name={s.name} />
                )}
                <div>
                  <h3 className="font-display text-[1.1rem] font-bold tracking-[-0.01em] text-white">
                    {s.name}
                  </h3>
                  <p className="text-xs text-teal-leg font-semibold">{s.role}</p>
                </div>
              </div>
              <p className="mt-4 text-[0.875rem] leading-relaxed text-white/75">{s.bio}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 text-[0.72rem] text-white/70 bg-white/[0.02]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
