"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconWhatsApp } from "@/src/components/careers/ui";

// Mirrors the homepage nav (public/index.html #nav): same link set and order,
// WhatsApp Community action, sticky blur surface and scroll-progress underline.
const NAV_LINKS = [
  { href: "/#success-stories", label: "Success Stories" },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#faculty", label: "Faculty" },
  { href: "/#faq", label: "FAQ" },
];

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
            <span className="mt-[0.25rem] hidden whitespace-nowrap font-body text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-muted sm:block">
              Upskill to Upscale
            </span>
          </div>
        </Link>

        {/* Navigation links — same set as the homepage nav */}
        <div className="hidden items-center gap-8 font-body text-[0.9rem] font-semibold text-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-teal-deep">
              {link.label}
            </Link>
          ))}
          <Link href="/careers" aria-current="page" className="font-bold text-teal-mid">
            Careers
          </Link>
        </div>

        {/* Actions: WhatsApp Community (homepage .nav-wa) + roles CTA */}
        <div className="flex items-center gap-5">
          <a
            href="https://chat.whatsapp.com/CDVzRz1dHYiBxNPx1HH6ZD"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 font-body text-[0.875rem] font-bold text-wa transition-colors hover:text-[#075E54] md:flex"
            data-track="nav_wa"
          >
            <IconWhatsApp className="h-4 w-4" />
            WhatsApp Community
          </a>
          <Link
            href="/careers#positions"
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-pill bg-teal-mid px-5 py-[0.65rem] font-body text-[0.875rem] font-bold tracking-[-0.005em] text-white transition-all duration-200 hover:bg-emerald-dark hover:-translate-y-px hover:shadow-msc-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-mid"
          >
            View roles
          </Link>
        </div>
      </div>

      {/* Dynamic Scroll Progress Bar — mirrors homepage #nav::after */}
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
