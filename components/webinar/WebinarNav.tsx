"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics";

/**
 * Sticky nav that mirrors the live site's #nav exactly:
 * frosted-glass background, logo + wordmark, single CTA.
 * Links back to the main site homepage.
 */
export function WebinarNav() {
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
          : "border-b border-transparent bg-[rgba(250,249,246,0.85)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Logo — links back to main site */}
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="MedSkills Catalyst — back to home"
        >
          <div className="h-10 w-10 flex-shrink-0">
            {/* SVG logo — same path the existing site uses */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <span className="mt-[0.2rem] hidden whitespace-nowrap font-body text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink/50 sm:block">
              Upskill to Upscale
            </span>
          </div>
        </Link>

        {/* Single CTA — anchors to the registration form */}
        <a
          href="#register"
          onClick={() => trackCtaClick("Reserve free seat", "nav")}
          className={
            "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-msc bg-emerald " +
            "px-5 py-[0.65rem] font-body text-[0.875rem] font-bold text-white tracking-[-0.005em] " +
            "transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px " +
            "hover:shadow-[0_6px_20px_rgba(10,42,67,0.18)]"
          }
        >
          Reserve free seat →
        </a>
      </div>
    </nav>
  );
}
