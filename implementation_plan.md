# Careers Brand-Alignment — Implementation Plan

Source spec: `~/Desktop/Claude-Code-Careers-Rework-Prompt.md`. Goal: make `/careers` and `/careers/campus-ambassador` a native extension of the homepage design system. Homepage untouched.

## Task 1 audit — files located

**Careers flow (Next.js App Router, styled with Tailwind):**
- `[MODIFY]` src/app/careers/page.tsx — careers listing page (white hero, AI illustration, emoji chips, "Showing 1 available roles")
- `[MODIFY]` src/app/careers/[slug]/page.tsx — role page shell (white hero, AI illustration, sticky Job Brief, emoji chips)
- `[MODIFY]` src/components/careers/JobDetailClient.tsx — About/Responsibilities/Eligibility/Benefits/Timeline/FAQ sections (✓/★ mixed icons)
- `[MODIFY]` src/components/careers/ApplicationForm.tsx — 8-step dark (slate-900) form → 2 steps on light surface; endpoint `/api/careers/apply` and all field names preserved
- `[MODIFY]` src/components/careers/CareersNav.tsx — reduced nav, "Explore Openings" square-ish CTA
- `[MODIFY]` src/components/careers/CareersFooter.tsx — diverges from homepage footer
- `[MODIFY]` src/app/careers/success/page.tsx — success page (minor copy/style alignment)
- `[MODIFY]` src/data/jobs.ts — "Remote (Your College)" → "On-Campus + Remote"
- `[MODIFY]` tailwind.config.ts — add missing homepage tokens (pill radius, radius-xl, shadow-glow, slate, warning); no new hex outside the homepage `:root` set
- `[NO CHANGE]` src/app/api/careers/apply/route.ts — submission logic untouched (server requires: job_slug, full_name, email, phone, city, state, country, university, resume)

**Canonical design system source:** `public/index.html` `:root` (lines 37–93) + `.btn`/`.btn-chip` (132–151) + `.hero-card` (389) + nav (3240–3267) + faculty cards (4009–4066) + footer (4190–4223). Read-only reference.

## Decisions
- No form field is removed — spec requires confirmation before deleting any field. Instead: Step 1 = essentials (name, email, phone, WhatsApp, city/state/country), Step 2 = academics + resume + declaration, with everything else in collapsible "Add more detail (optional)" disclosures. Same names, same FormData payload, same endpoint.
- Company logo files don't exist in the repo → trust strip renders text names as muted caps with a `TODO` comment (per spec).
- No real photography for heroes → founder photo (`/assets/gagan_victor.png`, already used on homepage) inside the navy hero-card + `TODO` for a proper shoot/video.
- Batch 1 proof block: labeled `TODO` placeholders, no fabricated numbers.
- CTA vocabulary: "Apply" (form/apply actions), "View role" (role card), "View roles" (nav/hero links to the listing).

## Commit sequence
1. Tokens: extend tailwind.config.ts with homepage tokens (Task 1)
2. Nav + footer parity with homepage (Task 2)
3. /careers: navy hero-card + trust strip + Open Opportunities fixes + values cards with SVG icons (Tasks 3–5)
4. Role page: navy hero, founder/proof module, content sections + icon unification, sticky-brief fix (Tasks 6–8)
5. Application form → 2 steps on light surface (Task 9)
6. CTA copy standardization, deadline color, mobile apply bar, a11y pass (Tasks 10–12)

Verification: `npm run build` + dev-server screenshots of both pages at 1440px and 390px, before and after.
