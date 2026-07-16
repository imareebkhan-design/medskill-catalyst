import React from "react";

/* Founder cards mirror the homepage Faculty card (photo, name, one-line
   credential) plus a "why we built this" line grounded in existing site copy. */

const FOUNDERS = [
  {
    photo: "/assets/gagan_victor_headshot.png",
    name: "Gagan Victor",
    credential: "Co-Founder & Program Director · Former Pfizer, BMS, Medtronic & Stryker",
  },
  {
    photo: "/assets/shilpi_babbar.jpg",
    name: "Shilpi Babbar",
    credential: "Co-Founder & Skills Enhancement Coach · ICBI-NABET certified, 11+ years of coaching",
  },
];

export function FounderTrust() {
  return (
    <section aria-labelledby="founders-heading" className="text-left">
      <div className="mb-8">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.15em] text-teal-mid">
          Who You&apos;ll Work With
        </span>
        <h2 id="founders-heading" className="font-display text-[1.75rem] sm:text-[2.1rem] font-bold tracking-tight text-teal-deep mt-3">
          Built by people who hire in MedTech
        </h2>
        <p className="text-[0.95rem] leading-relaxed text-muted mt-3 max-w-2xl">
          We built this program because most life-science students never hear that a career in
          MedTech is possible until after they graduate. Ambassadors work directly with the founders,
          not a layer of coordinators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {FOUNDERS.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-5 bg-surface border border-[rgba(10,42,67,0.08)] p-6 rounded-msc-lg shadow-msc-sm"
          >
            <img
              src={f.photo}
              alt={f.name}
              width={80}
              height={80}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-full object-cover object-top border border-[rgba(10,42,67,0.15)]"
            />
            <div>
              <h3 className="font-display text-[1.1rem] font-bold text-teal-deep">{f.name}</h3>
              <p className="text-[0.825rem] leading-relaxed text-muted mt-1">{f.credential}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Batch 1 proof — this is Batch 2, so surface the prior cohort.
          TODO(data): fill in real Batch 1 numbers (ambassador count, campus count)
          and one short quote from a Batch 1 ambassador. Do NOT invent figures. */}
      <div className="bg-teal-pale/60 border border-teal-mid/10 rounded-msc-lg p-6 md:p-7">
        <h3 className="font-display text-[1.05rem] font-bold text-teal-deep mb-1.5">
          Batch 1 ran earlier this year
        </h3>
        <p className="text-[0.875rem] leading-relaxed text-muted">
          You&apos;d be joining the second cohort of this program. We&apos;re compiling the Batch 1
          results — ambassador count, campuses covered, and what they went on to do — and will publish
          them here shortly. Ask us about Batch 1 on WhatsApp in the meantime.
        </p>
      </div>
    </section>
  );
}
