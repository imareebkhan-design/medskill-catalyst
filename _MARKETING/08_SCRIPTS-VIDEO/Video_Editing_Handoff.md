# MedSkills Catalyst — Video Editing Session Handoff

Paste this into a new Claude Code chat to resume. It captures the tools, the exact recipe, brand rules, and the honest limitations so the next session moves fast without re-deriving anything.

---

## 0. First message to send in the new chat

> Resume my MedSkills video-editing work. Read `Video_Editing_Handoff.md` in the repo root first. Activate the antigravity-protocol and humanizer skills (I use them for every edit and every caption). Then wait for the video I'll attach.

Skills used every time:
- **`/antigravity-protocol`** — efficient, chunk-based execution (targeted edits, no chat dumps, plan for big tasks).
- **`anthropic-skills:humanizer`** — run on ALL marketing copy/captions (no em dashes, no forced rule-of-three, natural voice).

---

## 1. What we're doing

Turning raw talking-head videos (WhatsApp exports of the founders) into production-ready MedSkills reels for Instagram / LinkedIn, promoting **Cohort 1** of the 6-week MedTech Career Accelerator (starts 1 Aug 2026, "now enrolling"). Each video gets: brand frame/full-screen, logo, burned captions, studio audio, branded intro + outro, IG/LinkedIn post caption.

## 2. Toolchain (all local; NOTHING is a paid service)

The scratchpad dir is WIPED between sessions, so these get re-installed/re-downloaded each time:

- **ffmpeg** (Homebrew): `brew install ffmpeg`. IMPORTANT: this build has **NO drawtext and NO libass** — you cannot burn text with ffmpeg. All text (captions, hooks, footers, logo lockups, intro/outro cards) is rendered as **transparent PNGs via headless Chrome** and composited with ffmpeg `overlay`.
  - Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` with `--headless=new --default-background-color=00000000 --window-size=WxH --screenshot=out.png file://page.html` (transparent). Fonts load from Google Fonts (network works in headless).
- **whisper.cpp** for transcription: `brew install whisper-cpp` (binary `whisper-cli`). Model: `curl -sL -o ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin` (small.bin download tends to stall; base works). For Hinglish audio use `-l hi -tr` (translate to English) or `-l en`; the raw transcript is rough, so CLEAN/CORRECT it before burning (e.g. it hears "pharma"→"far more", "MedSkills"→"Medescale").
- **RNNoise model** for `arnndn` denoise: `curl -sL -o bd.rnnn https://raw.githubusercontent.com/GregorR/rnnoise-models/master/beguiling-drafter-2018-08-30/bd.rnnn`

## 3. The MedSkills reel recipe (proven, approved)

Build a Python script per video that renders overlay PNGs via Chrome then runs one ffmpeg. Canvas 1080x1920 (IG/full-screen) or 1080x1080 (LinkedIn square).

**Video (full-screen / cover-crop):**
`fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1`
- For low-res sources, upscale + clean: `hqdn3d=2:1.5:3:3,scale=1080:1920:flags=lanczos,unsharp=5:5:0.7:5:5:0.0,eq=contrast=1.06:saturation=1.08:brightness=0.008`
- "T-shirt crop" (end frame at chest, top-anchored): `scale=1920:1080,scale=iw*1.28:ih*1.28,crop=1080:1080:(iw-1080)/2:70` (square example; adapt).
- NOTE: `scale=-2:H` broke on one source (SAR gave 0x1); use explicit dims or `force_original_aspect_ratio`.

**Audio — the APPROVED chain is "B" (balanced). User picked it after an A/B/C blind test:**
`highpass=f=85,arnndn=m='<bd.rnnn>',equalizer=f=300:t=q:w=1.3:g=-3,equalizer=f=3000:t=q:w=1.2:g=4.5,treble=g=3:f=8500,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=150:makeup=5,alimiter=limit=0.97,loudnorm=I=-14:TP=-1.2:LRA=9`
- DON'T stack arnndn + afftdn (muffles the voice — user rejected that). Single natural denoise + presence EQ + loud (-14 LUFS).
- **You cannot hear the output.** When audio quality is in question, render 2–3 short (~18s) A/B/C samples with different chains and send them for the user to pick. Do not iterate blind.

**Overlays (all transparent PNGs via Chrome, composited with overlay + enable timing):**
- **Logo top-left**: the REAL logo is `brand/logo/MedSkills-Catalyst_Logo.png` (transparent circular badge). Scale ~134px, overlay at `40:44`. (Do NOT use a text wordmark — user wants the actual logo.)
- **Captions**: English, corrected to what's actually said, timed to speech (approximate is OK — timing is synced to whisper segments, not word-perfect). Two styles used:
  - Lower-third pill: dark rounded box `rgba(6,25,43,.8)`, white 800 weight, cyan `#4AD0FF` keyword highlight.
  - **Trending style ABOVE the head** (what the user landed on): bold white, `-webkit-text-stroke:3px black; paint-order:stroke fill`, keyword in a **yellow `#FFD21E`** highlight box; band positioned `top:150px`. (User may ask for blue instead of yellow.)
- **Footer** (persistent, bottom): `＋ Follow @medskillscatalyst` pill (`#00589E`) + `Cohort 1 · now enrolling` (cyan bold).
- **Intro** (~0.8s, smooth open): logo fades up on navy radial gradient, then `xfade=transition=fade:duration=0.4:offset=0.8` into the video; audio `adelay=800|800,afade=in`. Keep short so the hook still lands by ~1s.
- **Outro** (~4s, fixes abrupt endings): navy card with logo + "COHORT 1 · NOW ENROLLING" + "Join the MedSkills Catalyst cohort" + "Book a discovery call · link in bio"; `xfade` in over 0.5s; voice `afade=out` at the end.

**Encode (production-ready):** `-c:v libx264 -profile:v high -crf 20 -preset medium -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart`

## 4. Format targets
- **Instagram Reels / Facebook Reels**: 9:16, 1080x1920. (Feed posts want 4:5–16:9; a 9:16 gets rejected on the *feed* upload path — tell the user to post via the Reel tab.)
- **LinkedIn**: square **1:1, 1080x1080** is the safe default (user chose this). Re-layout: caption band ~`top:672`, footer ~`bottom:52`.

## 5. Brand + copy rules
- Colors: navy `#0A2A43`, blue `#00589E`, cyan `#4AD0FF`. Fonts: Fraunces (display) + Plus Jakarta Sans (UI).
- Copy: **company voice** for company-page posts (MedSkills as "we"), but "students come to **Gagan Victor**" (the founder), not to "MedSkills" generically. CTA = **book a discovery call, link in bio** (NO "comment MEDTECH" mechanic — user removed it). Keep captions short/crisp. Humanizer on everything, no em dashes.
- Compliance (BRAND.md): no fabricated scarcity; "India's only accelerator" is the founder's on-video claim — keep only if verifiable or soften to "one of the first"; salary figures (pharma 3–5 LPA → MedTech 6–10) and market stats ($5B→$15B→$50B, 27%) are the founders' on-video claims, mirror only, flag for verification.

## 6. Key people/facts
- **Gagan Victor** — co-founder (NOT "hiring manager"); 25 years of hiring experience across Pfizer, Medtronic, Stryker (his experience, no logos, text only).
- **Shilpi Babbar** — co-founder, empathy/mentor voice (the woman in the denim outfit holding "The Niche Code" book).
- IG handle assumed **@medskillscatalyst** (confirm; re-render is quick if wrong).
- Cohort 1 = 6-week MedTech Accelerator, starts 1 Aug 2026, interview-gated, "now enrolling".

## 7. Honest limitations (state these to the user)
- **Cannot hear audio** → use A/B/C sample method.
- **Cannot watch Instagram reels** (login/JS wall) → WebFetch only returns the post caption text, not the visual editing. Work from the user's description.
- **Cannot add music** → all tracks in ~/Downloads are copyrighted (Bollywood, Sunflower, etc.); won't burn those into a public post. Tell user to use Instagram's in-app licensed music, or provide a royalty-free file to mix in (ducked under voice).
- No CapCut-style word-by-word karaoke captions (toolchain can't); phrase-level burned captions only.

## 8. Deliverables produced this session (in ~/Downloads/)
- `MedSkills_Reel_IG_edit.mp4` — first pharma-tips reel (Gagan), brand-frame + captions.
- `MedSkills_Reels/Reel1..8_*.mp4` — 8 vertical reels cut from Gagan's 4-min cohort pitch (`WhatsApp Video ...14.31.33.mp4`), full-screen, hooks, captions, fixed CTA.
- `MedSkills_Cohort_Promo.mp4` — 61s Gagan cohort promo (full-screen, reordered to end on invite, T-shirt crop, studio audio, logo intro).
- `MedSkills_NicheCode_ProdReady.mp4` — Shilpi/Niche-Code reel: upscaled 480p→1080p, logo, captions ABOVE head (yellow trending style), **B audio**, "Join the Cohort" outro. 88s. FINAL.
- Analysis/copy docs in repo root: `Reels_8x_Analysis.md`, `Reels_4x1min_Plan.md`, `Reel_IG_Caption.md`, `Campaign-Cohort1-Launch.md`, `Campaign-New-Posts.md`.

## 9. Open / next
- LinkedIn square build (`build_cohort_li.py`) was in progress; last fix was the overlay base `[vc][4:v]overlay` (had an unconnected-`[vc]` bug). Re-verify it renders.
- Optional: mix user-provided royalty-free music (ducked) into the Niche-Code reel.
- Also pending from the broader campaign (separate track): fill Cohort tokens (seats, price, enrollment link, WhatsApp link), lift `[HOLD]` on Campaign posts.
- A PR to `imareebkhan-design/medskill-catalyst` (branch main) for the repo doc changes was requested but not completed.
