# LinkedIn Webinar Creative — "This Room Is Not For Everyone"

Static creative spec for the Pharma→MedTech free masterclass post (founder voice: Gagan Victor).
**All brand values below are pulled from `BRAND.md` — nothing here is invented.** Locked palette, locked fonts (Fraunces + Plus Jakarta Sans), locked radii, locked voice.

---

## 1. Creative Trend Analysis

What is actually stopping the scroll on professional feeds right now (2025–26), filtered to what's relevant for a single static image:

- **Typography IS the design.** The best-performing B2B static posts are type-led, not image-led. No stock photo, no illustration carrying the idea — one dominant phrase does the work. High contrast + confident type now beats "soft minimalism." (Adobe / Kittl / Fontfabric 2026 trend reports.)
- **Portrait 4:5 (1080×1350) wins the feed.** It eats the most vertical real estate before the next post pushes it off-screen — a measurable scroll-stop advantage over square. Mobile is ~60% of views, so the *headline must survive at thumbnail size.*
- **One idea, readable in 3 seconds.** Value/hook legible before anyone reads the caption. The image is a second hook layered on top of the text hook.
- **Specificity > vagueness.** Numbers and named segments ("3–10 years," "10+ years") out-perform generic claims. Concrete = credible.
- **Authenticity over polish.** Audiences (especially cynical, scam-wary professionals) reward human, honest, slightly understated design over glossy "webinar graphic" energy. Founder-led framing ("here's who I built this for") is a trust signal, not a sales signal.
- **Whitespace = premium.** Generous negative space reads as confidence. Cluttered = cheap = skip.
- **CTA is soft on the creative.** High performers don't scream "REGISTER NOW." They use a quiet detail line ("link in comments") and let the hook pull. The post does the selling; the image earns the stop.

**Best style for this professional audience:** editorial, type-driven, high-contrast, near-zero ornamentation. Think *invitation card / manifesto*, not *event flyer*.

---

## 2. Recommended Creative Direction

**ONE concept: "The Velvet Rope."** A dark, editorial invitation card that filters the reader in the first half-second.

The entire post's power is the line *"This room is not for everyone."* So the creative leads with exactly that — oversized, serif, on a deep navy field — and stages the **binary tension as the visual itself**: a clean checklist of the four people it *is* for, and one muted line of who it's *not* for.

Why this is the single best concept:
- **The tension is the hook.** The reader self-sorts into "that's me" or "this isn't for me" before reading a word of the caption — exactly the brief's goal.
- **Navy field = scroll-stop by contrast.** ~90% of LinkedIn creatives are white/bright. A calm, dark, serif card interrupts the pattern and reads instantly premium. `BRAND.md` explicitly endorses anchoring dark surfaces in Navy with editorial serif headings.
- **Founder-led, not salesy.** It looks like a personal note, not an ad. No badges, no countdown clock, no cheesy "FREE WEBINAR" starburst.
- **On-brand by construction.** Navy base, white headline, rationed cyan as the only accent, Fraunces display, Jakarta details. Nothing off-system.

**Deliberately avoided:** stock photos, business-people handshakes, generic webinar templates, icon soup, gradients, drop-shadow overload, multi-colour badge clutter.

*(Alt palette if you ever want a lighter set: same layout on `--canvas` cream with navy type. Navy is the recommendation — it stops harder.)*

---

## 3. Wireframe Layout

```
┌─────────────────────────────────────────┐  1080 × 1350  (4:5)  — Navy #0A2A43
│  ⟵ 80px margin all sides ⟶                │
│                                           │
│  FREE LIVE MASTERCLASS · SATURDAY   [eyebrow, pale-blue, tracked]
│                                           │
│                                           │
│  This room is              [Fraunces italic, pale-blue]
│  NOT FOR                   [Fraunces 600, white, huge]
│  EVERYONE̶                  [huge + thin CYAN rule struck through]
│                                           │
│  — but it might be for you.   [Fraunces italic, white]
│                                           │
│  ┌─────────────────────────────────────┐ │  ← qualifier panel
│  │  WHO I BUILT THIS ROOM FOR          │ │     (pale-blue 6% tint, radius 20)
│  │  ✓  B.Pharm / M.Pharm — fresh out   │ │
│  │  ✓  Medical reps · 3–10 yrs in      │ │
│  │  ✓  Pharma managers · 10+ yrs       │ │
│  │  ✓  Already in MedTech? Send your   │ │
│  │     junior.                          │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Not for you if you want a guarantee,     [muted white]
│  a shortcut, or you're not serious.       │
│                                           │
│  ───────────────────────────────────────  [hairline]
│  SATURDAY · LIVE · 90 MIN · FREE     — Gagan Victor
│  [MedSkills logo]        Register → link in comments
└─────────────────────────────────────────┘
```

Three stacked zones: **Hook (top 45%) → Qualifier panel (middle 35%) → Footer (bottom 20%).**

---

## 4. Visual Hierarchy

1. **`NOT FOR EVERYONE`** — the focal point. Biggest element, white serif, cyan strike through "EVERYONE." This is what's legible at thumbnail and what stops the scroll.
2. **`This room is` / `— but it might be for you.`** — the framing whispers around the shout; italic, smaller, softer colour.
3. **The 4 ✓ profiles** — the "is this me?" payload. Scannable, equal weight, cyan ticks pull the eye down the list.
4. **The exclusion line** — intentionally muted (low-opacity white). It's the velvet rope; it should feel quieter, not louder.
5. **Footer details + logo + CTA** — smallest. Logistics, not hook. "Link in comments" is the only CTA, deliberately soft.

Eye path: huge headline → "for you?" → tick list (self-sort) → exclusion (qualify) → when/where → register. Tension first, logistics last.

---

## 5. Full Design Specification

*Pixel-level, brand-locked. Another designer/AI should be able to rebuild this exactly.*

**Canvas**
- Size: **1080 × 1350 px** (4:5 portrait). Export @2x (2160×2700) for crispness.
- Background: solid **Navy `#0A2A43`**. No gradient. Optional: a single near-invisible hairline frame inset 40px in `rgba(255,255,255,0.06)` for an "invitation card" edge (optional, subtle).
- Outer margin / safe area: **80px** all sides → content width **920px**.
- Grid: single column, 8px spacing base (all gaps are multiples of 8).

**Fonts** (locked — `BRAND.md` §4)
- Display/headline: **Fraunces** — weights 500 (italic) & 600. Tight tracking on the punch line.
- Everything else (eyebrow, list, footer, CTA): **Plus Jakarta Sans** — 400 / 500 / 600.
- Never swap roles. Load both via Google Fonts.

**Colour tokens used** (locked — `BRAND.md` §2)
- `--navy #0A2A43` — background.
- `--cyan #4AD0FF` — accent ONLY: the strike rule + the 4 ticks. Nothing else.
- white `#FFFFFF` — primary headline + CTA pill text.
- `--pale-blue #E8F2FB` — eyebrow, italic framing lines, footer label.
- Muted body on navy = `rgba(255,255,255,0.62)` (do **not** use `--slate` on navy — it fails contrast; slate is for light canvas only).
- Panel fill = `rgba(232,242,251,0.06)` (pale-blue at 6%), hairline border `rgba(255,255,255,0.10)`.

**Type scale & spacing (top → bottom)**

| Element | Font / weight | Size / line-height | Colour | Notes |
|---|---|---|---|---|
| Eyebrow | Jakarta 600 | 22px / 1.3, UPPERCASE, tracking **0.32em** | pale-blue | Top of content area, y≈80px |
| Headline line 1 "This room is" | Fraunces **italic** 500 | 60px / 1.0, tracking −0.01em | pale-blue | 48px gap below eyebrow |
| Headline "NOT FOR" | Fraunces 600 | **132px** / 0.94, tracking −0.02em | white | |
| Headline "EVERYONE" | Fraunces 600 | **132px** / 0.94, tracking −0.02em | white | **cyan rule** struck through (see below) |
| Sub "— but it might be for you." | Fraunces italic 500 | 38px / 1.2 | white | 32px below headline |
| Panel label "WHO I BUILT THIS ROOM FOR" | Jakarta 600 | 18px / 1.3, UPPERCASE, tracking 0.28em | pale-blue | inside panel, top |
| Profile rows (×4) | Jakarta 500 | 27px / 1.45 | white | 20px row gap; cyan ✓ at 22px, 16px left of text |
| Exclusion line | Jakarta 400 | 21px / 1.5 | `rgba(255,255,255,0.62)` | below panel, 32px gap |
| Footer details | Jakarta 600 | 19px / 1.3, UPPERCASE, tracking 0.2em | pale-blue | above hairline |
| Founder credit "— Gagan Victor" | Jakarta 500 | 19px / 1.3 | white | right-aligned, same row |
| CTA "Register → link in comments" | Jakarta 500 | 19px / 1.3 | navy on pill | bottom-right |

**The cyan strike-through (focal device)**
- A single straight rule, **3px** thick, **`--cyan #4AD0FF`**, centred vertically through the word "EVERYONE," extending ~4px past each end of the word. Crisp, not hand-drawn, no glow. This is the visual metaphor for "not everyone" and the single strongest accent moment.

**Qualifier panel**
- Width: full 920px content width. Padding: 40px all sides. Corner radius: **20px** (`BRAND.md` radius scale 8/12/20/28).
- Fill `rgba(232,242,251,0.06)`; 1px hairline border `rgba(255,255,255,0.10)`. No shadow (it's on a dark field).
- Ticks: cyan check glyph, consistent baseline with first line of each row. Row 4 wraps to "Send your junior." on a second indented line.

**CTA treatment**
- A pill, **bottom-right**, height 56px, horizontal padding 28px, corner radius **28px** (fully rounded).
- Fill: white (or pale-blue `#E8F2FB`); label navy `#0A2A43`, Jakarta 600 18px. (Brand's blue-fill/white-label button goes muddy on navy — invert to white-pill/navy-label for AA contrast. White on navy = 14.74:1.)
- This is the only "button." Keep "Register → link in comments" honest and low-pressure.

**Logo**
- MedSkills Catalyst logo, bottom-left of footer, on the quiet navy field (allowed background per `BRAND.md` §1). Use as-is, do not recolour/redraw. Height ~44px.

**Elevation, borders, motion**
- No drop shadows (banned on dark). Hairlines only: `rgba(255,255,255,0.10)`.
- Static asset — no motion. (If ever animated: fade + 12px rise, 200ms ease-out, honour reduced-motion.)

**Negative space / balance**
- ~40% of the canvas is empty navy. The headline breathes; the panel is the only "filled" mass. Vertical rhythm: hook block top-weighted, footer pinned bottom, generous air between zones. Never crowd the headline against the panel.

**Thumbnail test (must pass):** at 150px wide, "NOT FOR EVERYONE" + the cyan strike must still read. If it doesn't, increase headline size before anything else.

---

## 6. Final Claude Design Prompt

> Paste-ready. Brand assets are already specified — attach the MedSkills Catalyst logo file before running.

```
Create a single static LinkedIn creative — portrait 4:5, 1080×1350px, export-clean.

CONCEPT: a premium, editorial "invitation card" that filters the viewer. It must make a pharma professional instantly think "that's me" or "this isn't for me." Type-led, no photography, no illustration, no icons beyond simple checkmarks. Calm, confident, founder-led — NOT a webinar flyer.

BACKGROUND: solid deep navy #0A2A43. No gradient. Optional ultra-subtle inset hairline frame at rgba(255,255,255,0.06), 40px from the edge. ~40% of the canvas stays empty navy — generous negative space.

FONTS: Fraunces (serif) for the headline and italic framing lines ONLY. Plus Jakarta Sans (sans) for everything else — eyebrow, list, footer, CTA. Never mix these roles.

MARGINS: 80px safe area all sides; single-column layout; 8px spacing rhythm.

LAYOUT, top to bottom:

1. EYEBROW (top): "FREE LIVE MASTERCLASS · SATURDAY" — Plus Jakarta Sans 600, 22px, all caps, letter-spacing 0.32em, colour pale-blue #E8F2FB.

2. HEADLINE (focal point, upper-middle):
   - Line 1: "This room is" — Fraunces italic 500, ~60px, pale-blue #E8F2FB.
   - Line 2: "NOT FOR" — Fraunces 600, ~132px, white, line-height 0.94, letter-spacing -0.02em.
   - Line 3: "EVERYONE" — same as line 2, white, with a single straight 3px cyan (#4AD0FF) rule struck horizontally through the whole word, extending slightly past both ends. Crisp line, no glow.
   - Below headline: "— but it might be for you." Fraunces italic 500, ~38px, white.

3. QUALIFIER PANEL (middle): a rounded rectangle, full content width, 20px corner radius, fill rgba(232,242,251,0.06), 1px hairline border rgba(255,255,255,0.10), 40px inner padding. Inside:
   - Label: "WHO I BUILT THIS ROOM FOR" — Jakarta 600, 18px, all caps, letter-spacing 0.28em, pale-blue.
   - Four rows, each with a cyan #4AD0FF checkmark + Jakarta 500, 27px, white text:
     ✓ B.Pharm / M.Pharm — fresh out, offers that don't excite you
     ✓ Medical reps · 3–10 yrs · watching the ceiling close in
     ✓ Pharma managers · 10+ yrs · runway quietly narrowing
     ✓ Already in MedTech? Send your junior.

4. EXCLUSION LINE (below panel): "Not for you if you want a guarantee, a shortcut, or you're not serious." — Jakarta 400, 21px, muted white rgba(255,255,255,0.62). Intentionally quieter than everything above.

5. FOOTER (bottom): a 1px hairline divider rgba(255,255,255,0.10), then a row:
   - Left: "SATURDAY · LIVE · 90 MIN · FREE" — Jakarta 600, 19px, all caps, letter-spacing 0.2em, pale-blue.
   - Right: "— Gagan Victor" — Jakarta 500, 19px, white.
   - Bottom-left: the attached MedSkills Catalyst logo, ~44px tall, used exactly as supplied (do not recolour or redraw).
   - Bottom-right: a white pill (height 56px, 28px radius, 28px horizontal padding) with navy #0A2A43 label "Register → link in comments", Jakarta 600, 18px.

COLOUR DISCIPLINE: navy background; white for the headline and CTA text; pale-blue #E8F2FB for eyebrow, italic lines, and footer labels; cyan #4AD0FF used ONLY for the strike-through rule and the four checkmarks — nowhere else. Muted secondary text is white at 62% opacity, never grey.

STYLE: editorial, premium, high-contrast, minimal. No drop shadows, no glows, no gradients, no stock photos, no business-people, no badges/starbursts, no extra icons. Whitespace and typographic confidence carry it.

CRITICAL: "NOT FOR EVERYONE" with the cyan strike-through must remain legible at thumbnail size (~150px wide). It is the scroll-stopper.

OUTPUT: one finished creative at 1080×1350, plus an editable version so date/details can be swapped later.
```

---

### One stress-test note (read before you ship)
The only real risk in this concept is **text load** — four profiles + an exclusion line is more copy than the "under 20% text" rule of thumb. It works *because the headline is doing the stopping* and the list is read after the stop. Protect that by (a) keeping "NOT FOR EVERYONE" genuinely huge and thumbnail-legible, and (b) not adding a single element beyond what's specced. If you feel it's crowded, cut the profile descriptors down to the bold segment only ("B.Pharm / M.Pharm", "MR · 3–10 yrs", "Manager · 10+ yrs", "Send your junior") — the headline and ticks still carry the whole idea.
