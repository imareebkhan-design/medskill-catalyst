"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CareersNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-[900] h-[76px] transition-all duration-300 ${
        scrolled
          ? "border-b border-ink/8 bg-white/92 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-md"
          : "border-b border-transparent bg-white/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" aria-label="MedSkills Catalyst — Home">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              src="/brand/logo/MedSkills-Catalyst_Logo-01.svg"
              alt="MedSkills Catalyst logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block whitespace-nowrap font-display text-[1rem] font-bold leading-none tracking-[-0.01em] text-teal-deep sm:text-[1.15rem]">
              MedSkills Catalyst
            </span>
            <span className="mt-[0.2rem] hidden whitespace-nowrap font-body text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink/50 sm:block">
              Careers Portal
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden items-center gap-8 font-body text-[0.875rem] font-medium text-ink/75 md:flex">
          <Link href="/#success-stories" className="transition-colors hover:text-teal-mid">
            Success Stories
          </Link>
          <Link href="/#curriculum" className="transition-colors hover:text-teal-mid">
            Curriculum
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-teal-mid">
            FAQ
          </Link>
          <Link href="/careers" className="font-semibold text-teal-mid">
            Careers
          </Link>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/careers#positions"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-msc bg-teal-mid px-5 py-[0.65rem] font-body text-[0.875rem] font-bold text-white tracking-[-0.005em] transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(10,42,67,0.12)]"
          >
            Explore Openings →
          </Link>
        </div>
      </div>
    </nav>
  );
}
