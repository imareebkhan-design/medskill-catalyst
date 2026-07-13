"use client";

import React, { useState } from "react";
import { JobOpening } from "@/src/data/jobs";

interface JobDetailClientProps {
  job: JobOpening;
}

export function JobDetailClient({ job }: JobDetailClientProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="space-y-10">
      {/* About Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-4">
          About the Program
        </h3>
        <p className="text-[0.95rem] leading-relaxed text-ink/70">
          {job.about}
        </p>
      </div>

      {/* Responsibilities Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Key Responsibilities
        </h3>
        <ul className="space-y-4">
          {job.responsibilities.map((resp, idx) => (
            <li key={idx} className="flex items-start gap-3.5 text-[0.925rem] text-ink/70">
              <span className="h-6 w-6 rounded-full bg-teal-pale border border-teal-mid/10 text-teal-mid flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 shadow-sm">
                ✓
              </span>
              <span className="leading-relaxed">{resp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Eligibility Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Eligibility & Requirements
        </h3>
        <ul className="space-y-4">
          {job.eligibility.map((elig, idx) => (
            <li key={idx} className="flex items-start gap-3.5 text-[0.925rem] text-ink/70">
              <span className="h-6 w-6 rounded-full bg-teal-pale border border-teal-mid/10 text-teal-mid flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 shadow-sm">
                ★
              </span>
              <span className="leading-relaxed">{elig}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Benefits Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Ambassador Benefits & Perks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.benefits.map((benefit, idx) => {
            const [title, desc] = benefit.split(":");
            return (
              <div key={idx} className="p-5 bg-canvas/40 border border-ink/6 rounded-msc-lg hover:bg-white hover:border-teal-mid/20 hover:shadow-msc-sm transition-all duration-200">
                <h4 className="font-display text-[0.95rem] font-bold text-teal-deep mb-1">
                  {title}
                </h4>
                {desc && (
                  <p className="text-[0.825rem] leading-relaxed text-ink/55">
                    {desc.trim()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-8">
          Hiring Timeline
        </h3>
        <div className="relative border-l-2 border-teal-pale pl-6 ml-4 space-y-8">
          {job.timeline.map((item, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline marker */}
              <span className="absolute -left-[35px] top-0 h-6.5 w-6.5 rounded-full bg-teal-pale border-2 border-teal-mid text-teal-deep font-bold text-[0.72rem] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-teal-mid group-hover:text-white transition-all duration-200">
                {item.phase}
              </span>
              <div className="p-4 bg-canvas/30 border border-ink/4 rounded-xl group-hover:bg-white group-hover:border-teal-mid/10 group-hover:shadow-[0_4px_12px_rgba(10,42,67,0.02)] transition-all duration-250">
                <h4 className="font-body text-[0.95rem] font-bold text-teal-deep mb-1">
                  {item.label}
                </h4>
                <p className="text-[0.825rem] text-ink/50 leading-none">
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-[0_2px_8px_rgba(12,35,57,0.03)] text-left hover:shadow-[0_12px_32px_rgba(10,42,67,0.06)] hover:border-teal-mid/10 transition-all duration-300 ease-out">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Answers to What You're Probably Thinking
        </h3>
        <div className="space-y-4">
          {job.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border-b border-ink/5 last:border-0 pb-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left font-display text-[1.05rem] font-semibold text-teal-deep py-2.5 hover:bg-canvas/50 px-4 rounded-xl -mx-4 transition-all duration-200 focus:outline-none"
                >
                  <span className="pr-4">{faq.question}</span>
                  <span className={`text-teal-mid text-lg font-bold transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"}`}>
                  <div className="overflow-hidden">
                    <p className="text-[0.9rem] leading-relaxed text-ink/65 px-4 -mx-4 pb-2">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
