import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { CareersNav } from "@/src/components/careers/CareersNav";
import { CareersFooter } from "@/src/components/careers/CareersFooter";
import { IconCheck, IconUsers, IconWhatsApp } from "@/src/components/careers/ui";

export const metadata: Metadata = {
  title: "Application Success — MedSkills Catalyst",
  description: "Thank you for applying. Your application has been successfully submitted."
};

function SuccessContent({ searchParams }: { searchParams: { id?: string; role?: string } }) {
  const appId = searchParams.id || "MSC-APP-PENDING";
  const roleName = searchParams.role || "Job Opening";

  return (
    <div className="bg-canvas flex-1 flex flex-col items-center justify-center py-16 px-6 font-body text-ink text-center">
      <div className="max-w-xl w-full bg-white border border-ink/8 p-8 md:p-12 rounded-msc-lg shadow-msc-md">
        {/* Success Icon */}
        <div className="h-20 w-20 rounded-full bg-teal-pale border border-teal-mid/20 text-teal-mid flex items-center justify-center mx-auto mb-8">
          <IconCheck className="h-9 w-9" />
        </div>

        <h1 className="font-display text-[2rem] sm:text-[2.25rem] font-bold tracking-tight text-teal-deep mb-4">
          Application Submitted!
        </h1>
        
        <p className="text-[1rem] leading-relaxed text-ink/65 mb-8">
          Thank you for applying. Our recruitment team will review your qualifications and contact shortlisted candidates for interviews.
        </p>

        {/* Application details */}
        <div className="bg-canvas border border-ink/8 rounded-msc-lg p-5 mb-8 text-left space-y-3">
          <div className="flex justify-between border-b border-ink/5 pb-2 text-[0.875rem]">
            <span className="text-ink/50 font-medium">Applied Position:</span>
            <span className="text-teal-deep font-bold">{roleName}</span>
          </div>
          <div className="flex justify-between text-[0.875rem]">
            <span className="text-ink/50 font-medium">Application ID:</span>
            <span className="text-teal-mid font-mono font-bold tracking-wider">{appId}</span>
          </div>
        </div>

        {/* Next steps */}
        <div className="space-y-4 mb-8">
          <h4 className="text-[0.875rem] font-bold uppercase tracking-[0.05em] text-teal-deep text-left">
            Next Steps & Updates
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://chat.whatsapp.com/CDVzRz1dHYiBxNPx1HH6ZD"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#128C7E]/5 hover:bg-[#128C7E]/10 border border-[#128C7E]/10 rounded-msc text-left transition-colors group"
            >
              <span className="text-wa"><IconWhatsApp className="h-5 w-5" /></span>
              <div>
                <span className="block text-[0.8rem] font-bold text-[#128C7E]">WhatsApp Community</span>
                <span className="block text-[0.7rem] text-ink/50 mt-0.5">Join for live updates</span>
              </div>
            </a>

            <a
              href="https://www.linkedin.com/company/medskills-catalyst"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 border border-[#0A66C2]/10 rounded-msc text-left transition-colors group"
            >
              <span className="text-[#0A66C2]"><IconUsers className="h-5 w-5" /></span>
              <div>
                <span className="block text-[0.8rem] font-bold text-[#0A66C2]">LinkedIn Page</span>
                <span className="block text-[0.7rem] text-ink/50 mt-0.5">Follow for program news</span>
              </div>
            </a>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-pill border border-[rgba(10,42,67,0.15)] bg-white px-7 py-3 font-body text-[0.9rem] font-bold text-teal-deep hover:bg-canvas transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-mid"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ id?: string; role?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="bg-canvas min-h-screen flex flex-col">
      <CareersNav />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-canvas">Loading...</div>}>
        <SuccessContent searchParams={resolvedSearchParams} />
      </Suspense>
      <CareersFooter />
    </div>
  );
}
