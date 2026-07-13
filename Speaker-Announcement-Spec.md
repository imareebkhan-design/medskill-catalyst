# Speaker Announcement Creative — "Meet The Room"

Rebrand of your RIOBook 3-column reference to the MedSkills system. Layout, structure and energy kept identical; only the **brand system** changes (palette, fonts, logo) plus the speakers. Vincent Keny removed → 3 people remain, which is exactly the reference's 3-column grid.

Companion render: **`Speaker-Announcement-Creative.html`** (1080×1350). Open it from this folder in a browser to see Gagan's real photo + the logo; export/screenshot at 1080×1350 for LinkedIn. Deepankar & Shubham are clean labeled placeholders — drop their photos into `public/assets/` and swap the two `<div class="ph-fallback">` blocks for `<img>` tags.

---

## What changed vs the reference (only the branding)

| Reference (RIOBook) | MedSkills version |
|---|---|
| RIOBook + Zoom logos, top-center | **MedSkills Catalyst logo, top-left** (per your instruction) + small "Masterclass · Live on Zoom" eyebrow top-right |
| Heavy black grotesque headline | **Fraunces 600**, navy `#0A2A43` — "FREE MASTERCLASS / MEET THE ROOM" |
| Green highlight pill ("RIOBook") | **Blue pill** `#00589E`, white text — "4 JULY · 8 PM IST" |
| Green photo gradients | **Pale-blue → blue** gradient `#E8F2FB → #00589E` |
| Three different dates (3-session series) | **One shared date band** (single session) — the one necessary change, see note below |
| Per-column topic hashtags | Kept: `#pharma_to_medtech` / `#the_hiring_desk` / `#fresher_placements` |
| B&W headshots | Same B&W treatment (CSS `grayscale`) — Gagan real, 2 placeholders |
| Book-author captions | Role/credential captions, trimmed |
| — | **Cyan `#4AD0FF`** used only for: host outline + "HOST" badge + band dots (rationed accent) |

**The one deliberate deviation:** the reference shows three different dates because it's a 3-part series. Yours is a single Saturday session with all speakers in one room, so three different dates would be misleading. I collapsed them into one date band and made the columns pure speaker cards. Gagan sits **center with a HOST badge** (natural hierarchy). If you'd rather mirror the reference 1:1 with a date repeated under each column, say so and I'll switch it.

---

## Locked brand spec (from BRAND.md)
- Canvas **1080×1350**, margins 56px, light canvas `#F7F9FB` (60% light, on-brand).
- Fonts: **Fraunces** (headline, names, initials) · **Plus Jakarta Sans** (everything else).
- Palette: navy `#0A2A43`, blue `#00589E`, cyan `#4AD0FF` (accent only), pale-blue `#E8F2FB`, slate `#5A6B7B`, ink `#0F1B27`.
- Radii 22px (cards) / 10px (pill) / 999px (band, badges). Hairline borders `rgba(10,42,67,0.08)`. Soft navy-tinted shadows. No green, no black drop shadows, no gradients on type.
- Logo used as-is, never recoloured.

---

## Paste-ready Claude Design prompt

```
Recreate the attached reference poster's EXACT layout, structure, spacing and energy, but fully rebranded to the MedSkills Catalyst system. Portrait 4:5, 1080×1350px.

KEEP IDENTICAL TO THE REFERENCE: the top logo zone, the giant stacked headline with a highlighted pill in the middle, the three equal photo columns with a topic tag above each B&W portrait, the bold name under each photo, and the small italic credential caption beneath the name.

CHANGE ONLY THE BRAND SYSTEM:
- Background: light off-white canvas #F7F9FB with a very subtle paper texture (not green, not white-flat).
- Logo: MedSkills Catalyst logo, TOP-LEFT (attached), used exactly as supplied. Small uppercase tag top-right: "MASTERCLASS · LIVE ON ZOOM".
- Fonts: Fraunces (serif) for the headline, speaker names and any large letters; Plus Jakarta Sans (sans) for tags, captions, pill, date band, footer. Never swap these roles.
- Headline (Fraunces 600, navy #0A2A43, tight tracking): "FREE MASTERCLASS" / a blue pill #00589E with white text "4 JULY · 8 PM IST" / "MEET THE ROOM".
- Date band (single pill, pale-blue #E8F2FB fill, navy text): "Saturday 4 July · 8:00 PM IST · Live · Free · One room, three voices".
- Photo columns: each portrait sits on a gradient from pale-blue #E8F2FB at top to blue #00589E at bottom; photos are black & white. Card radius 22px, soft navy-tinted shadow.
- Accent colour cyan #4AD0FF used ONLY for: a thin outline + a "HOST" badge on the centre (host) card, and small dots in the date band. Nowhere else.

THREE SPEAKERS (left → centre → right):
1) Deepankar Chugh — tag "#pharma_to_medtech" — caption: "Area Manager, Boston Scientific. 15 yrs Pharma → MedTech. Started as a Novartis MR. 4 country sales awards."
2) Gagan Victor [HOST, centre, cyan badge] — tag "#the_hiring_desk" — caption: "Your host. 25 yrs across Pfizer, BMS, Medtronic & Stryker. Both sides of the hiring desk." (use attached photo, in B&W)
3) Shubham Sharma — tag "#fresher_placements" — caption: "Placement Manager, KIET · Sr. Educator, Adda247. B.Pharm · M.Pharm · MBA. Mentor to hundreds of grads."
(For speakers without a photo, use a clean B&W placeholder with the person's initials and a small "Photo to add" label.)

FOOTER: thin hairline divider, then left "LIVE CAP 300 · REPLAY ONLY FOR REGISTERED" (slate, uppercase) and right a navy pill "Register → link in comments" (arrow in cyan).

STYLE: editorial, premium, high-trust, minimal. No stock business people, no fake handshakes, no green anywhere, no extra icons, no drop-shadow overload. Whitespace and confident typography carry it. Names and headline must read at thumbnail size.

OUTPUT: one finished creative at 1080×1350, plus an editable version so photos and the date can be swapped.
```

### Before you post
- **Get Deepankar's & Shubham's headshots** (plain background, shoulders-up) and drop them in — the grid only sings with three real faces.
- **Photo consistency:** Gagan's is full-body; the other two should be framed similarly (shoulders-up or half-body) so the row is even. I've set photos to crop from the top — re-frame if Gagan looks too zoomed.
- The post text still says "Four people" — update it to **three** since Vincent is out.
