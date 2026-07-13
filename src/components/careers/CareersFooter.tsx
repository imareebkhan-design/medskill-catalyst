import Link from "next/link";

export function CareersFooter() {
  return (
    <footer className="bg-teal-deep text-white border-t border-white/10 py-12 md:py-16 font-body">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 flex-shrink-0">
                <img
                  src="/brand/logo/MedSkills-Catalyst_Logo-01.svg"
                  alt="MedSkills Catalyst logo"
                  className="h-full w-auto object-contain brightness-0 invert"
                />
              </div>
              <span className="font-display text-[1.25rem] font-bold tracking-[-0.01em]">
                MedSkills Catalyst
              </span>
            </div>
            <p className="text-[0.9rem] text-white/70 max-w-sm leading-relaxed mb-6">
              Empowering the next generation of Life Sciences and Healthcare professionals to transition into rewarding MedTech sales, regulatory, and application careers.
            </p>
            <div className="flex flex-col gap-2 text-[0.85rem] text-white/60">
              <span>✉ <a href="mailto:info@medskillscatalyst.com" className="hover:text-white transition-colors">info@medskillscatalyst.com</a></span>
              <span>💬 <a href="https://wa.me/919759249395" className="hover:text-white transition-colors">Chat with us on WhatsApp</a></span>
            </div>
          </div>

          {/* Site Links */}
          <div>
            <h4 className="text-[0.875rem] font-bold uppercase tracking-[0.05em] text-teal-leg mb-4">
              Portal
            </h4>
            <div className="flex flex-col gap-3 text-[0.9rem] text-white/70">
              <Link href="/" className="hover:text-white transition-colors">
                Main Site
              </Link>
              <Link href="/careers" className="hover:text-white transition-colors">
                Careers Home
              </Link>
              <Link href="/careers/campus-ambassador" className="hover:text-white transition-colors">
                Campus Ambassador Program
              </Link>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-[0.875rem] font-bold uppercase tracking-[0.05em] text-teal-leg mb-4">
              Legal
            </h4>
            <div className="flex flex-col gap-3 text-[0.9rem] text-white/70">
              <a href="/terms-of-use.html" className="hover:text-white transition-colors">
                Terms of Use
              </a>
              <a href="/privacy-policy.html" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/refund-policy.html" className="hover:text-white transition-colors">
                Refund Policy
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.8rem] text-white/40">
          <span>&copy; {new Date().getFullYear()} MedSkills Catalyst. All rights reserved.</span>
          <span>Designed for premium careers in MedTech.</span>
        </div>
      </div>
    </footer>
  );
}
