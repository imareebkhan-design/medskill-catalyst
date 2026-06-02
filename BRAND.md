# MedSkills Catalyst — Brand Spec (for engineers & agents)

This is the machine-readable source of truth for the website redesign. The logo is **locked and trademarked** — never modify it. Everything else here is law.

Positioning: **India's Career Accelerator for Healthcare Professionals Entering MedTech.**
Tagline: **Upskill to Upscale.**
Brand feel: premium, calm, editorial, credible — *not* clinical, corporate, or hype.

---

## 1. Logo (locked)

Files live in `public/brand/logo/` (see setup note at bottom).

- Use the supplied logo **exactly as-is**. Do NOT recolour, redraw, crop, simplify, rotate, regenerate, or re-typeset it.
- Background allowed: white, Pale Blue `#E8F2FB`, or Navy `#0A2A43` only. Never on busy/bright/low-contrast backgrounds.
- The master is a **raster PNG inside an SVG wrapper** — not true vector. Do not upscale beyond native resolution. Use at moderate sizes (header/footer).
- **Favicon:** the detailed emblem does not resolve below ~40px. Use the supplied file at the largest the slot allows; if it looks like mush, use a temporary plain placeholder and leave `TODO: replace with authorised simplified favicon lockup`. Do NOT invent a simplified logo.

## 2. Colour tokens

```css
:root {
  --navy:      #0A2A43; /* authority, dark sections, headlines on light */
  --blue:      #00589E; /* PRIMARY: CTAs, links, structure (from logo) */
  --cyan:      #4AD0FF; /* ACCENT ONLY — rationed (from logo) */
  --ink:       #0F1B27; /* body text */
  --pale-blue: #E8F2FB; /* tints, pills, soft fills */
  --slate:     #5A6B7B; /* captions, secondary text */
  --canvas:    #F7F9FB; /* dominant page background */
  --surface:   #FFFFFF; /* cards, sheets */
}
```

Semantic: success `#1A8F5C`, warning `#B45309`, error `#B42318`, info `#00589E`. Always pair with icon + text, never colour alone.

### 60 · 30 · 10 law
- 60% = light canvas (`--canvas` / white). The page is light-dominant. Never a wall of blue.
- 30% = navy + blue structure (headlines, dark heroes, cards, footers).
- 10% = accents: one blue CTA per view, one cyan highlight/active state, the logo.

## 3. Accessibility (hard rules — WCAG 2.1 AA minimum)

Measured ratios:
- `--ink` on `--canvas` = 16.49:1 (AAA) — body text.
- `--navy` on `--canvas` = 13.96:1 (AAA) — headlines.
- white on `--blue` = 7.27:1 (AAA) — **primary buttons: blue fill, white label.**
- white on `--navy` = 14.74:1 (AAA) — text on dark heroes.
- `--cyan` on `--navy` = 8.25:1 (AAA) — cyan accent on dark is fine.
- `--cyan` on white = 1.79:1 (**FAILS**) — never cyan text on light.
- white on `--cyan` = 1.79:1 (**FAILS**) — never white text on cyan.

Rules: primary CTA = blue fill + white label. Cyan only as accent on dark or as a non-text shape. Never set body text in blue or cyan. Captions in `--slate`.

## 4. Typography

- **Fraunces** (serif) — display & headings ONLY. Weights 500–600. Tight negative tracking on headlines.
- **Plus Jakarta Sans** (sans) — all UI, body, labels, buttons.
- Never swap their roles. Load via Google Fonts.
- Fallbacks — headings: `Fraunces, 'Cormorant Garamond', Georgia, serif`; body/UI: `'Plus Jakarta Sans', Inter, -apple-system, 'Segoe UI', Arial, sans-serif`.

| Level | Font | Spec |
|---|---|---|
| Display/H1 | Fraunces 600 | clamp 44–82px, lh 1.02, tracking −0.02em |
| Section/H2 | Fraunces 500 | 30–46px, lh 1.10, tracking −0.015em |
| Subhead/H3 | Jakarta 600 | 20–22px, lh 1.2 |
| Body | Jakarta 400 | 16–17px, lh 1.7, measure 60–75ch |
| Label/tagline | Jakarta 600 | 11–13px, UPPERCASE, tracking 0.40em |

## 5. Design language

- Corner radii: 8 / 12 / 20 / 28px. Concentric (nested radius = parent − padding).
- Borders: hairline `rgba(10,42,67,0.08)` — never solid gray.
- Elevation: soft navy-tinted ambient shadow. Whitespace + tint first, border second, shadow last.
- Banned: black drop shadows, neon glows, gradients on functional UI, harsh lines, bright-blue fields behind body text.
- Motion: subtle only — fade + 8–16px rise on scroll, 150–300ms ease-out. Honour `prefers-reduced-motion`. Nothing bouncy.
- Grid: 12-col web, max content ≈1200px, 8px spacing base. Mobile = single column, same 8px rhythm.
- "Softening the clinical mark" levers: anchor dark surfaces in Navy (not bright blue), editorial serif headings, generous whitespace, rationed cyan, muted cool-graded real photography, logo always on a quiet field.

## 6. Voice (for all copy)

Sage archetype: persuade by being clear and right, not loud. Mentor, not marketer. The student is the hero; we are the guide.
- Use: route, path, bridge, transition, evidence, mentor, proof, trajectory, upscale.
- Avoid: 10x, guru, secret, hack, life-changing, guaranteed, hustle, manifest.
- Specific & provable over sweeping. Honest over hyped ("this isn't for everyone" beats a guarantee).

## 7. Content integrity (CRITICAL — legal)

The current live site ships **fabricated** placement proof (named alumni + salaries, "200+ placed," "93% in 90 days," fake auditor signatures, partner logos implying placements). **Remove ALL of it** — it's an ASCI + Consumer Protection Act 2019 liability and the fake signatures edge toward fraud.

Replace with honest **founding-cohort** framing. Invent nothing — no fake names, numbers, logos, testimonials, certificates. Use real people/facts only; where real input is missing, insert a labelled `PLACEHOLDER` and list what's needed. Include a real, linked Refund Policy. Ranged/honest claims only, no guarantees.

## 8. Funnel

Hero CTA = **free masterclass/workshop** (low-friction modal: 2 fields + 1 qualifier). Then nurture → application (multi-step) → counselling call → enrol. Do NOT use a cold "Pay/Apply ₹X" hero CTA.

---

### Setup note (do this before building)
1. Keep this file at the repo root as `BRAND.md`.
2. Unzip the official logo into `public/brand/logo/` and reference those files in the header/footer.
3. The agent should read `BRAND.md` first, then follow the redesign brief.
