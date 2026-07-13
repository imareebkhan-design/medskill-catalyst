import React from "react";
import { JobOpening } from "@/src/data/jobs";
import {
  IconAward,
  IconBanknote,
  IconCheck,
  IconFastForward,
  IconFileBadge,
  IconGraduationCap,
  IconUsers,
} from "@/src/components/careers/ui";

const cardClass =
  "bg-surface border border-[rgba(10,42,67,0.08)] p-8 rounded-msc-lg shadow-msc-sm text-left";

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3.5 text-[0.925rem] text-muted">
      <span className="h-6 w-6 rounded-full bg-teal-pale text-teal-mid flex items-center justify-center shrink-0 mt-0.5">
        <IconCheck className="h-3.5 w-3.5" />
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

// One icon per benefit, matched on the benefit title keyword.
function benefitIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("stipend")) return IconBanknote;
  if (t.includes("lor") || t.includes("recommendation")) return IconFileBadge;
  if (t.includes("hiring")) return IconFastForward;
  if (t.includes("certificate")) return IconAward;
  if (t.includes("workshop")) return IconGraduationCap;
  return IconUsers;
}

/** About / Responsibilities / Eligibility / Benefits — the sections that sit
    beside the sticky Job Brief column. */
export function JobSections({ job }: { job: JobOpening }) {
  return (
    <div className="space-y-8">
      {/* About */}
      <div className={cardClass}>
        <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-4">
          About the Program
        </h2>
        <p className="font-display text-[1.1rem] leading-snug text-teal-deep/90 mb-4">
          {job.about[0]}
        </p>
        {job.about.slice(1).map((para, idx) => (
          <p key={idx} className="text-[0.95rem] leading-relaxed text-muted mb-3 last:mb-0">
            {para}
          </p>
        ))}
      </div>

      {/* Responsibilities */}
      <div className={cardClass}>
        <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Key Responsibilities
        </h2>
        <ul className="space-y-4">
          {job.responsibilities.map((resp, idx) => (
            <CheckItem key={idx}>{resp}</CheckItem>
          ))}
        </ul>
      </div>

      {/* Eligibility */}
      <div className={cardClass}>
        <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Eligibility &amp; Requirements
        </h2>
        <ul className="space-y-4">
          {job.eligibility.map((elig, idx) => (
            <CheckItem key={idx}>{elig}</CheckItem>
          ))}
        </ul>
      </div>

      {/* Benefits */}
      <div className={cardClass}>
        <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Benefits &amp; Perks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.benefits.map((benefit, idx) => {
            const [title, desc] = benefit.split(":");
            const Icon = benefitIcon(title);
            return (
              <div
                key={idx}
                className="p-5 bg-canvas border border-[rgba(10,42,67,0.08)] rounded-msc-md hover:bg-surface hover:border-teal-mid/20 hover:shadow-msc-sm transition-all duration-200"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-msc bg-teal-pale text-teal-mid">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-[0.95rem] font-bold text-teal-deep mb-1">
                  {title}
                </h3>
                {desc && (
                  <p className="text-[0.825rem] leading-relaxed text-muted">
                    {desc.trim()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Hiring timeline — rendered full-width below the two-column area. */
export function JobTimeline({ job }: { job: JobOpening }) {
  return (
    <div className={cardClass}>
      <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
        Hiring Timeline
      </h2>
      <ol className="relative border-l-2 border-teal-pale pl-6 ml-3 space-y-5">
        {job.timeline.map((item, idx) => (
          <li key={idx} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[34px] top-0 h-6 w-6 rounded-full bg-teal-pale border-2 border-teal-mid text-teal-deep font-bold text-[0.7rem] flex items-center justify-center"
            >
              {item.phase}
            </span>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 pb-1">
              <h3 className="font-body text-[0.95rem] font-bold text-teal-deep">
                {item.label}
              </h3>
              <p className="text-[0.825rem] font-semibold text-muted whitespace-nowrap">
                {item.date}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
