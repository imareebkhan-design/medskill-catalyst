"use client";

import React, { useState } from "react";
import { JobFAQItem } from "@/src/data/jobs";

export function JobFaq({ faqs }: { faqs: JobFAQItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx));
  };

  return (
    <div className="bg-surface border border-[rgba(10,42,67,0.08)] p-8 rounded-msc-lg shadow-msc-sm text-left">
      <h2 className="font-display text-[1.4rem] font-bold text-teal-deep mb-6">
        Answers to What You&apos;re Probably Thinking
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className="border-b border-[rgba(10,42,67,0.08)] last:border-0 pb-2">
              <button
                onClick={() => toggleFaq(idx)}
                aria-expanded={isOpen}
                className="w-full min-h-[44px] flex items-center justify-between text-left font-display text-[1.05rem] font-semibold text-teal-deep py-3 px-4 rounded-msc -mx-4 hover:bg-canvas transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-mid"
              >
                <span className="pr-4">{faq.question}</span>
                <span
                  aria-hidden="true"
                  className={`text-teal-mid text-lg font-bold transition-transform duration-200 shrink-0 ${isOpen ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-[0.9rem] leading-relaxed text-muted pb-3">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
