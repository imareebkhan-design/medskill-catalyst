# LinkedIn Webinar Creative #2 — "Capped at 300"

Static creative for the 3-days-out momentum/scarcity post (founder voice: Gagan Victor).
**Same visual system as creative #1 ("This Room Is Not For Everyone") — a deliberate sibling.** All brand values pulled from `BRAND.md`; nothing invented. The only thing that changes is the *focal device*: creative #1 struck out a word; this one puts a single live **number** at the centre.

---

## 1. Creative Trend Analysis (scarcity edition)

Carried over from the campaign research, narrowed to what a *momentum/scarcity* creative needs:

- **A number is the strongest possible focal point.** On a professional feed, a large, specific figure ("[XX] seats left") out-stops any phrase. Specificity reads as real; round hype reads as fake.
- **Honest scarcity > manufactured urgency.** This audience is scam-wary. The cap works *because there's a stated reason for it* ("live Q&A only works in a small room"). Show the reason, not a countdown clock. Brand voice bans "guaranteed / hurry / last chance" energy — the design must feel like a status update, not a flash sale.
- **Proof is the second hook.** "Why people are showing up" = the speaker's track record. Credentials in plain, scannable lines (companies, numbers, what he actually did) do more than any testimonial — and stay compliance-safe because they're the speaker's real history, not invented student outcomes.
- **Portrait 4:5, thumbnail-legible.** Same as #1 — the seat number must read at ~150px wide.
- **Consistency compounds.** Because this matches creative #1's navy card, a viewer who saw the first post recognises the second instantly. The *set* builds trust; one-off designs don't.

---

## 2. Recommended Creative Direction

**Concept: "The Counter."** The same navy editorial invitation card — but now the velvet rope has a number on it.

Focal point = the live seat count. Everything else (the deliberate cap, the speaker's credibility, the honest terms) orbits that one figure. The tension shifts from *"is this me?"* to *"am I about to miss the one room that was built for this?"* — without a single hype word.

Why this is the right move:
- **It reuses your equity.** Identical grid, palette, type, and tone as creative #1, so the campaign reads as one confident series.
- **The number does the stopping.** A big cyan "[XX]" is the scroll-interrupt; the cap rationale makes it honest; Gagan's record makes it worth acting on.
- **Founder-led, status-update tone.** Reads like Gagan telling you where things stand — not an ad shouting at you.

**Deliberately avoided:** countdown timers, red "HURRY" banners, fake progress bars, stock photos, badges, icon soup, gradients.

---

## 3. Wireframe Layout

```
┌─────────────────────────────────────────┐  1080 × 1350  (4:5)  — Navy #0A2A43
│  ⟵ 80px margin all sides ⟶                │
│                                           │
│  FREE LIVE MASTERCLASS · 4 JULY · 3 DAYS OUT   [eyebrow, pale-blue, tracked]
│                                           │
│  We capped it at 300.        [Fraunces italic, pale-blue]
│                                           │
│  [XX]                        [HUGE Fraunces 600, CYAN — the focal number]
│  LIVE SEATS LEFT             [Fraunces 600, white]
│                                           │
│  [XXX] registered · capped on purpose,    [Jakarta, muted white]
│  so Gagan can actually hear the room.     │
│                                           │
│  ┌─────────────────────────────────────┐ │  ← proof panel
│  │  WHY PEOPLE ARE SHOWING UP          │ │     (pale-blue 6% tint, radius 20)
│  │  ·  25 yrs — Pfizer · BMS ·          │ │
│  │     Medtronic · Stryker              │ │
│  │  ·  Hired hundreds into device       │ │
│  │     sales, clinical & product        │ │
│  │  ·  Rejected thousands of CVs        │ │
│  │  ·  Saturday: why most pharma CVs    │ │
│  │     never pass the first filter      │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Free · live, not pre-recorded · replay   [muted white]
│  goes only to the register list.          │
│                                           │
│  ───────────────────────────────────────  [hairline]
│  4 JULY · LIVE · 90 MIN · FREE     — Gagan Victor
│  [MedSkills logo]      Comment REGISTERED → we confirm tonight
└─────────────────────────────────────────┘
```

Same three zones as #1: **Hook (top ~45%) → Proof panel (middle ~35%) → Footer (bottom ~20%).**

---

## 4. Visual Hierarchy

1. **`[XX]`** — the live seat number, in cyan. Biggest, brightest element. The scroll-stopper.
2. **`LIVE SEATS LEFT` + `We capped it at 300.`** — frame the number; white serif punch + italic setup.
3. **The registered count + cap reason** — the honesty beat; muted, read after the stop.
4. **The 4 proof lines (Gagan's record)** — the "why act" payload; scannable, equal weight.
5. **Honest-terms line** — quiet, low-opacity. Reassurance, not shout.
6. **Footer details + logo + "Comment REGISTERED" CTA** — logistics, smallest.

Eye path: big number → "seats left" → why capped → who's teaching → terms → how to get in.

---

## 5. Full Design Specification

*Identical engine to creative #1 — only the focal device and copy differ. Pixel-level, brand-locked.*

**Canvas**
- Size: **1080 × 1350 px** (4:5). Export @2x (2160×2700).
- Background: solid **Navy `#0A2A43`**. No gradient. Optional inset hairline frame 40px in, `rgba(255,255,255,0.06)`.
- Margin / safe area: **80px** all sides → content width **920px**. Single column, 8px spacing base.

**Fonts** (locked — `BRAND.md` §4)
- Display: **Fraunces** 500 (italic) & 600 — eyebrow setup line, the seat number, "LIVE SEATS LEFT."
- Everything else: **Plus Jakarta Sans** 400/500/600. Never swap roles.

**Colour tokens** (locked — `BRAND.md` §2)
- `--navy #0A2A43` background · white `#FFFFFF` primary type · `--pale-blue #E8F2FB` eyebrow/italic/footer labels.
- `--cyan #4AD0FF` — accent ONLY: **the seat number `[XX]`**, the four "·" proof bullets, and (optionally) the CTA arrow. Nowhere else.
- Muted secondary text on navy = `rgba(255,255,255,0.62)` (never `--slate` on navy — fails contrast).
- Panel fill `rgba(232,242,251,0.06)`; hairline `rgba(255,255,255,0.10)`.

**Type scale & spacing (top → bottom)**

| Element | Font / weight | Size / line-height | Colour | Notes |
|---|---|---|---|---|
| Eyebrow | Jakarta 600 | 22px / 1.3, UPPERCASE, tracking 0.28em | pale-blue | y≈80px |
| "We capped it at 300." | Fraunces italic 500 | 46px / 1.1 | pale-blue | 40px below eyebrow |
| **`[XX]`** (seat number) | Fraunces 600 | **190px** / 0.9, tracking −0.03em | **cyan #4AD0FF** | focal point; baseline-align with next line if set inline |
| "LIVE SEATS LEFT" | Fraunces 600 | 64px / 1.0, tracking −0.02em | white | sits directly under/with the number |
| Registered + reason | Jakarta 400 | 23px / 1.5 | `rgba(255,255,255,0.62)` | "[XXX] registered · capped on purpose…" |
| Panel label "WHY PEOPLE ARE SHOWING UP" | Jakarta 600 | 18px / 1.3, UPPERCASE, tracking 0.28em | pale-blue | inside panel top |
| Proof rows (×4) | Jakarta 500 | 26px / 1.45 | white | 18px row gap; cyan "·" or small dash marker |
| Honest-terms line | Jakarta 400 | 21px / 1.5 | `rgba(255,255,255,0.62)` | below panel |
| Footer details | Jakarta 600 | 19px / 1.3, UPPERCASE, tracking 0.2em | pale-blue | above-left of footer |
| Founder credit "— Gagan Victor" | Jakarta 500 | 19px / 1.3 | white | right-aligned |
| CTA "Comment REGISTERED → we confirm tonight" | Jakarta 600 | 18px | navy on pill | bottom-right pill |

**The focal number (scroll-stop device)**
- `[XX]` set at **190px Fraunces 600 in cyan `#4AD0FF`** — the single brightest mark on the canvas, mirroring how creative #1 used cyan for the strike-through. Keep it a clean numeral, no glow, no outline.
- It's a **swap-slot** — keep the brackets in the working file so the live number drops in at post time. Same for `[XXX] registered` and the "300" cap (300 is fixed, the rest update).

**Proof panel**
- Full 920px width, 40px padding, **20px** corner radius. Fill `rgba(232,242,251,0.06)`, 1px hairline `rgba(255,255,255,0.10)`. No shadow.
- Markers: cyan "·" (or a short cyan dash) leading each row, consistent baseline. Rows 1, 2 & 4 wrap to a second indented line.

**CTA treatment**
- Pill, bottom-right, height 56px, padding 28px, radius **28px** (fully rounded). Fill white / pale-blue `#E8F2FB`; label navy `#0A2A43`, Jakarta 600 18px. (Blue-on-navy goes muddy — invert to white-pill/navy-label, 14.74:1.)
- Copy "Comment REGISTERED → we confirm tonight" — soft, honest, no "REGISTER NOW."

**Logo**
- MedSkills Catalyst logo, bottom-left, as-is, ~44px tall, on the quiet navy field.

**Elevation / motion / negative space**
- No drop shadows. Hairlines only. Static asset. ~40% empty navy; the seat number breathes, the panel is the only filled mass.

**Thumbnail test (must pass):** at 150px wide, the cyan `[XX]` + "SEATS LEFT" must still read. If not, enlarge the number before touching anything else.

---

## 6. Final Claude Design Prompt

> Paste-ready. Attach the MedSkills Catalyst logo. Swap `[XX]` / `[XXX]` for live numbers before posting.

```
Create a single static LinkedIn creative — portrait 4:5, 1080×1350px, export-clean. It is the SECOND in a matched series, so it must share the exact visual system of a dark navy editorial "invitation card": solid navy background, Fraunces serif headline, Plus Jakarta Sans for everything else, rationed cyan as the only accent, generous negative space.

BACKGROUND: solid deep navy #0A2A43. No gradient. Optional ultra-subtle inset hairline frame at rgba(255,255,255,0.06), 40px from the edge. ~40% of the canvas stays empty navy.

FONTS: Fraunces (serif) for the italic setup line, the giant seat number, and "LIVE SEATS LEFT" only. Plus Jakarta Sans (sans) for eyebrow, proof list, terms line, footer, CTA. Never mix these roles.

MARGINS: 80px safe area all sides; single column; 8px spacing rhythm.

LAYOUT, top to bottom:

1. EYEBROW: "FREE LIVE MASTERCLASS · 4 JULY · 3 DAYS OUT" — Plus Jakarta Sans 600, 22px, all caps, letter-spacing 0.28em, pale-blue #E8F2FB.

2. FOCAL HOOK (upper-middle):
   - Setup line: "We capped it at 300." — Fraunces italic 500, ~46px, pale-blue #E8F2FB.
   - Giant number: "[XX]" — Fraunces 600, ~190px, colour CYAN #4AD0FF, line-height 0.9, letter-spacing -0.03em. This is the single brightest element and the scroll-stopper. Clean numeral, no glow.
   - "LIVE SEATS LEFT" — Fraunces 600, ~64px, white, directly beneath/beside the number.
   - Sub line: "[XXX] registered · capped on purpose, so Gagan can actually hear the room." — Plus Jakarta Sans 400, 23px, muted white rgba(255,255,255,0.62).

3. PROOF PANEL (middle): rounded rectangle, full content width, 20px corner radius, fill rgba(232,242,251,0.06), 1px hairline border rgba(255,255,255,0.10), 40px inner padding. Inside:
   - Label: "WHY PEOPLE ARE SHOWING UP" — Jakarta 600, 18px, all caps, letter-spacing 0.28em, pale-blue.
   - Four rows, each led by a small cyan #4AD0FF dot/dash, Jakarta 500, 26px, white:
     · 25 years across Pfizer, BMS, Medtronic, Stryker
     · Hired hundreds into device sales, clinical applications & product roles
     · Rejected thousands of CVs — he knows the first filter
     · Saturday: why most pharma CVs never get past it

4. HONEST-TERMS LINE (below panel): "Free · live, not pre-recorded · the replay goes only to the register list." — Jakarta 400, 21px, muted white rgba(255,255,255,0.62). Quieter than everything above.

5. FOOTER: 1px hairline divider rgba(255,255,255,0.10), then a row:
   - Left: "4 JULY · LIVE · 90 MIN · FREE" — Jakarta 600, 19px, all caps, letter-spacing 0.2em, pale-blue.
   - Right: "— Gagan Victor" — Jakarta 500, 19px, white.
   - Bottom-left: attached MedSkills Catalyst logo, ~44px tall, used exactly as supplied (do not recolour or redraw).
   - Bottom-right: a white pill (height 56px, 28px radius, 28px horizontal padding), navy #0A2A43 label "Comment REGISTERED → we confirm tonight", Jakarta 600, 18px.

COLOUR DISCIPLINE: navy background; white for "LIVE SEATS LEFT", proof rows and CTA text; pale-blue #E8F2FB for eyebrow, italic setup line and footer labels; cyan #4AD0FF ONLY for the giant seat number and the four proof bullets — nowhere else. Muted secondary text is white at 62% opacity, never grey.

STYLE: editorial, premium, high-contrast, minimal, honest. No countdown timers, no red "hurry" banners, no progress bars, no drop shadows, no glows, no gradients, no stock photos, no business-people, no badges, no extra icons. Whitespace and one big number carry it.

CRITICAL: the cyan "[XX]" and "SEATS LEFT" must stay legible at thumbnail size (~150px wide). It is the scroll-stopper. The creative must visibly match its sibling (creative #1) as one series.

OUTPUT: one finished creative at 1080×1350, plus an editable version so the seat numbers can be updated daily.
```

---

### Two stress-test notes before you ship
1. **Keep `[XX]` honest and live.** The whole concept rests on the number being real and updated. A stale or implausible figure ("2 seats left" for three days straight) burns the trust the brand voice is built on. Update it each day; if seats aren't genuinely scarce yet, lead with `[XXX] registered` as the focal number instead and move "seats left" to the sub-line.
2. **Don't let the proof panel out-shout the number.** Four credential lines is the ceiling — the number must stay the hero. If it feels dense, trim row 2 to "Hired hundreds into device, clinical & product roles." The number + the companies (Pfizer/BMS/Medtronic/Stryker) are the two things that have to land.
```
