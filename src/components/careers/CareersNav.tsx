"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CareersNav() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(window.scrollY / totalScroll);
      } else {
        setScrollProgress(0);
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial run
    onScroll();
    
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-[900] transition-all duration-400 ease-out ${
        scrolled
          ? "h-[68px] border-b border-ink/5 bg-white/92 shadow-[0_10px_30px_rgba(10,42,67,0.04)]"
          : "h-[76px] border-b border-transparent bg-[rgba(250,249,246,0.85)]"
      } backdrop-blur-md`}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 relative">
        {/* Logo Link */}
        <Link href="/" className="flex items-center gap-3" aria-label="MedSkills Catalyst — Home">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              src="/brand/logo/MedSkills-Catalyst_Logo-01.svg"
              alt="MedSkills Catalyst"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block whitespace-nowrap font-display text-[1rem] font-bold leading-none tracking-[-0.01em] text-teal-deep sm:text-[1.15rem]">
              MedSkills Catalyst
            </span>
            <span className="mt-[0.25rem] hidden whitespace-nowrap font-body text-[0.68rem] font-bold uppercase tracking-[0.05em] text-teal-mid sm:block">
              Upskill to Upscale
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <div className="hidden items-center gap-8 font-body text-[0.875rem] font-semibold text-ink/75 md:flex">
          <Link href="/#success-stories" className="transition-colors hover:text-teal-mid">
            Success Stories
          </Link>
          <Link href="/#curriculum" className="transition-colors hover:text-teal-mid">
            Curriculum
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-teal-mid">
            FAQ
          </Link>
          <Link href="/careers" className="font-bold text-teal-mid">
            Careers
          </Link>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/careers#positions"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-msc bg-teal-mid px-5 py-[0.65rem] font-body text-[0.875rem] font-bold text-white tracking-[-0.005em] transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(10,42,67,0.18)]"
          >
            Explore Openings →
          </Link>
        </div>
      </div>

      {/* Dynamic Scroll Progress Bar */}
      <div
        className="absolute left-0 bottom-[-1px] h-[2px] bg-gradient-to-r from-teal-mid to-teal-leg origin-left transition-transform duration-75 ease-out"
        style={{
          width: "100%",
          transform: `scaleX(${scrollProgress})`,
        }}
      />
    </nav>
  );
}
