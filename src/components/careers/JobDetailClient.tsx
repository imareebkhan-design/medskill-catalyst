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
    <div className="space-y-12">
      {/* About Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-4">
          About the Program
        </h3>
        <p className="text-[0.95rem] leading-relaxed text-ink/70">
          {job.about}
        </p>
      </div>

      {/* Responsibilities Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Key Responsibilities
        </h3>
        <ul className="space-y-3.5">
          {job.responsibilities.map((resp, idx) => (
            <li key={idx} className="flex items-start gap-3.5 text-[0.925rem] text-ink/75">
              <span className="h-5 w-5 rounded-full bg-teal-pale text-teal-mid flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                ✓
              </span>
              <span>{resp}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Eligibility Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Eligibility & Requirements
        </h3>
        <ul className="space-y-3.5">
          {job.eligibility.map((elig, idx) => (
            <li key={idx} className="flex items-start gap-3.5 text-[0.925rem] text-ink/75">
              <span className="h-5 w-5 rounded-full bg-teal-pale text-teal-mid flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                ★
              </span>
              <span>{elig}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Benefits Section */}
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Ambassador Benefits & Perks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.benefits.map((benefit, idx) => {
            const [title, desc] = benefit.split(":");
            return (
              <div key={idx} className="p-5 bg-canvas border border-ink/5 rounded-msc-lg">
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
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-8">
          Hiring Timeline
        </h3>
        <div className="relative border-l border-ink/10 pl-6 ml-3 space-y-8">
          {job.timeline.map((item, idx) => (
            <div key={idx} className="relative">
              {/* Timeline marker */}
              <span className="absolute -left-[35px] top-0 h-6 w-6 rounded-full bg-teal-pale border-2 border-teal-mid text-teal-mid font-bold text-[0.7rem] flex items-center justify-center">
                {item.phase}
              </span>
              <div>
                <h4 className="font-body text-[0.95rem] font-bold text-teal-deep leading-none mb-1.5">
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
      <div className="bg-white border border-ink/8 p-8 rounded-msc-lg shadow-msc-sm text-left">
        <h3 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {job.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="border-b border-ink/5 pb-4">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left font-display text-[1.05rem] font-semibold text-teal-deep py-2 focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <span className="text-teal-mid text-lg font-bold">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink/60 transition-all duration-300">
                    {faq.answer}
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
