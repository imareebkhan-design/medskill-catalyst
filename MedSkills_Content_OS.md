# MedSkills Catalyst — Content Operating System (Content OS)

*The foundation document. Version 1.0 · built 6 July 2026. This is the architecture, not the content. Once approved, each engine gets built out separately in the sequence at the end.*

> **What this is:** the complete operating system behind MedSkills Catalyst's content — how it's planned, made, published, engaged, repurposed, measured, and improved, every month, by any team member, for the next 12 months. It sits on top of the existing knowledge base and does not replace it.
>
> **Source-of-truth docs this OS orchestrates (do not duplicate — reference):** `BRAND.md` (brand law, voice, compliance), `MedSkills_Content_Engine_Spec.md` (LinkedIn writing calibration), `GTM_Sequencing_GrowthX_Selective_Model.md` (funnel philosophy), `LinkedIn_Page_Audit_and_Continuation_Plan.md` (LinkedIn diagnosis), `MedSkills_Catalyst_Master_Context.md` (accumulated strategy), the MedTech 101 webinar recording (the flagship repurposing asset).

---

# PART A — THE AUDIT (current state, before any recommendations)

## A1. What exists today (inventory)

**Brand & strategy layer (strong, well-documented):**
- `BRAND.md` — locked positioning ("India's Career Accelerator for Healthcare Professionals Entering MedTech"), tagline "Upskill to Upscale," Sage voice, color/type tokens, and a **critical legal flag**: the live site shipped fabricated placement proof that must be removed.
- `GTM_Sequencing…` — the two-layer model (Awareness ↔ Selective) and the honest-scarcity philosophy. This is the funnel spine.
- `MedSkills_Content_Engine_Spec.md` — a working LinkedIn generation spec, but **scoped to the 4 July masterclass campaign** (now past).
- Master Context + Swipe Sheet + 2 competitor reports — 86 posts of researched patterns, distilled into 9 hook types.

**LinkedIn layer:**
- Company page (~194 followers as of the June audit), Gagan's profile (~20.8k — the reach asset, still underused), Shilpi's profile (mentor voice, but thin/empty About + missing history).
- Proven winners: stat-threat ("$12B→$50B"), reframe ("exposure, not opportunity"), Shilpi's DM-story. Proven losers: the "[skill] is important ✅✅✅" template (retired).
- A full 16 Jun–4 Jul campaign calendar (executed), plus a `Content-Posts/` folder of finished role-decode captions and carousels (Device Sales, Clinical Applications, Regulatory, Medical Affairs/Market Access) + 3 carousel sets as PNGs + a 7-Roles carousel PDF.

**Webinar layer (the big one):**
- The first webinar **has run and is now a published YouTube asset** — "MedTech 101" masterclass. Host Gagan Victor + panel Deepankar Chugh (Novartis MR → Boston Scientific) + Shubham Sharma (placement manager). Chaptered, includes a live poll, real transition story, and Q&A.
- The real paid offer is named in it: the **6-week MedSkills Catalyst Career Accelerator**.

**Community layer:**
- WhatsApp Community is live; students from the webinar have joined. Invite link pinned in YouTube comments.

**Website / funnel layer:**
- Next.js webinar landing (`/webinar`), registration API + Supabase leads, admin dashboard, thank-you flow, lead-magnet ("28-page MedTech Career Transition Guide" — placeholder asset).

**Future channels (assets started, not launched):** Email newsletter (none yet), YouTube channel (1 flagship video live, "MedTech 101" branding + description/pinned-comment written).

## A2. Gaps

1. **No repeatable system — everything is campaign-shaped.** Every doc points at "4 July." The webinar is done; there is no monthly engine to run the *next* one, or the one after. This OS is the fix.
2. **The webinar recording is a goldmine sitting idle.** One 80-minute session with named real stories, a poll, and a Q&A can seed 6–8 weeks of content across every channel. Right now it's one YouTube upload.
3. **WhatsApp community has no content framework.** People joined; there's no daily/weekly value rhythm, no ritual, no conversion path from community → Accelerator. This is where trust either compounds or dies.
4. **Conversion path is implicit, not designed.** LinkedIn → webinar → WhatsApp → Accelerator exists as a funnel diagram but content isn't deliberately mapped to each stage. The 6-week Accelerator is the revenue event and almost no content is engineered to move people toward it.
5. **No analytics loop.** Metrics are named across docs but there's no weekly/monthly review ritual, no "how we decide what to make more of."
6. **Founder reach still under-activated.** The June audit's #1 lever (move founder-voice content to Gagan's 20k profile, amplify from the page) is a standing gap, not a solved one.
7. **No newsletter capture or YouTube cadence** — both are "future" with no on-ramp defined.

## A3. Overlaps & inconsistencies (clean these up)

- **Overlap:** `MedSkills_Content_Engine_Spec.md`, the Master Context, and the blueprint drafted earlier this session all restate the same voices/hooks/compliance. → **Resolution:** this OS names ONE canonical source per concept (below), and the others become historical/campaign references. No more triplicated voice specs.
- **Inconsistency — the date/offer:** `webinar.config.ts` still has "July 4th vs June 7th" reconciliation TODOs and placeholder WhatsApp/lead-magnet URLs, while the webinar has actually already aired. The live funnel data is stale relative to reality. → Flag for cleanup (website task, out of scope here, but it breaks any funnel we design on top of it).
- **Inconsistency — audience scope:** older docs say "pharma / life-science." The webinar broadened to **pharmacy, life sciences, biotechnology, biomedical, B.Tech**. The OS adopts the broader definition; ICP language must be updated everywhere.
- **Inconsistency — offer:** older docs optimize for "masterclass registrations." The masterclass is now a *recurring top-of-funnel*, and the **6-week Accelerator is the actual conversion goal**. The whole funnel re-points accordingly.

## A4. Opportunities (what this unlocks)

- **The webinar becomes a monthly flywheel.** Run one masterclass/month → each spins out a repurposing cascade → each feeds the community → each pitches the Accelerator once, honestly, at the end. Predictable, compounding.
- **Real proof is now possible.** The webinar has a real Novartis→Boston Scientific story (Deepankar) and real named experts — usable now, with consent. Cohort placement proof comes later per the GTM compliance gate.
- **Community-led growth.** A warm WhatsApp community + honest founder is exactly the "advocate not salesman" moat the GTM doc identifies. Systematized, it becomes the highest-trust conversion channel.

---

# PART B — STRATEGIC FOUNDATION (the fixed layer every engine inherits)

**Positioning:** India's Career Accelerator for healthcare & science graduates entering MedTech. **Tagline:** Upskill to Upscale. **Voice:** Sage — mentor not marketer, honest over hyped (full spec in `BRAND.md §6`).

**Audience (broadened):**
- **ICP-1 — Fresh graduate** (B.Pharm/M.Pharm/BSc/Biotech/Biomedical/B.Tech/MBA, 21–27): "My degree should mean something — how do I get into a real corporate role?"
- **ICP-2 — Working professional** (MR/lab/hospital/early-career, 25–38): "Is it too late? Does my experience count?" — answer YES before they ask.

**The three voices** (canonical spec: `MedSkills_Content_Engine_Spec.md §3`): Gagan (authority/reach, ICP-2), Shilpi (empathy, ICP-1), Company Page (the hub).

**Compliance spine (never break — canonical: `BRAND.md §7` + GTM §compliance):** no fabricated placements/salaries/outcomes without verified consented data; no fake scarcity; sourced stats framed as ranges; retire banned templates. Enforced *inside* every engine, not bolted on.

**The funnel (the whole OS points here):**

```
LinkedIn / YouTube  →  Webinar (monthly masterclass)  →  WhatsApp Community  →  Trust  →  6-Week Career Accelerator  →  Alumni  →  Referral
   (Awareness Layer, open, mass)        │                    (warm nurture)                 (Selective Layer, gated)
                                        └────────── the webinar is the bridge object ──────────┘
```

**Content balance (target ratio across all channels, per month):**
- 40% **Educational** (category-ed, role decodes, skill breakdowns) — the top-of-funnel job.
- 25% **Authority** (Gagan insider truth, stat-threat, contrarian, real stories) — reach + trust.
- 25% **Community** (segment-the-reader, discussions, polls, member wins) — warmth + self-identification.
- 10% **Promotional** (webinar reg + Accelerator) — and even this is framed as value ("here's the room we built"), never a hard sell.

Promotion is a *natural extension of value*, per the brief — the 10% only works because the 90% earned it.

---

# PART C — THE SIX ENGINES

Each engine is specified at the **system level** (design + SOP). Full build-out (templates, banks, first month's frameworks) happens per-engine after approval, in the Part F sequence.

## ENGINE 1 — LinkedIn Growth Engine

**Goal:** Turn LinkedIn into the predictable top of funnel — grow reach (esp. via Gagan), drive webinar registrations, and warm people toward the community + Accelerator.

**KPIs:** company-page follower growth %; Gagan-amplified reach vs page-only; self-identification comments ("this is me"); webinar registrations attributed to LinkedIn; profile→community click-through. *(North-star: registrations per posting week.)*

**Content pillars (4):** (1) The Map — category education / role decodes; (2) The Insider — Gagan authority, hiring-desk truth, stat-threat; (3) The Mirror — Shilpi empathy, segment-the-reader, reframe; (4) The Proof — real stories, webinar moments, community wins (compliance-gated).

**Weekly framework (default 5 posts/wk, 3 surfaces):**
| Day | Surface | Pillar | Purpose |
|---|---|---|---|
| Mon | Company | The Map | educational anchor (carousel or role decode) |
| Tue | Gagan | The Insider | authority/reach |
| Wed | Company/Shilpi | The Mirror | community + comments |
| Thu | Gagan or Shilpi | Proof/Story | trust |
| Fri | Company | Map/CTA | webinar runway (during a webinar month) |
| Sat/Sun | All | Amplify | reshares with a personal take (no new post) |

**Monthly workflow:** Month theme (tied to the month's webinar topic) → 20 post slots mapped to pillars → drafts via the LinkedIn generation spec → review against compliance → design (carousels) → schedule → engage → log results.

**Cadence:** 5 posts/week minimum; Gagan carries ≥2 (the reach lever). Every post = a specific number or sharp reframe in line 1 (proven pattern).

**Format mix (monthly):** ~40% text posts, ~30% carousels (save-bait, dwell-time winners), ~20% founder/story posts, ~10% polls/segment posts. Video clips from the webinar rotate in during repurposing weeks.

**CTA strategy:** ramps with campaign phase — Soft (link in comments) → Medium → Hard (real seat caps only). Off-campaign weeks route to the WhatsApp community, not a hard sell. **Prefer comment-to-DM / link-in-comments over in-post external links** (2026 reach penalty).

**Funnel integration:** LinkedIn's job is registrations + community joins, never a cold Accelerator pitch. The Accelerator is mentioned only as "what comes after," and only in the promotional 10%.

**Growth strategy:** activate Gagan as the primary distribution node (page amplifies him, not the reverse); segment-the-reader posts to build the warm list; consistent series so the audience learns the rhythm.

**SOP —** *Inputs:* month theme, webinar date, pillar map. *Outputs:* 20 scheduled posts + engagement log. *Owner:* Content Lead (drafting) + Gagan/Shilpi (voice approval). *Frequency:* monthly plan, weekly batch, daily engage. *Tools:* generation spec, scheduler (Buffer/native), Canva/design, tracking sheet. *Success:* hit cadence + registration target + follower growth. *Checklist:* [ ] pillar-balanced [ ] compliance-passed [ ] line-1 hook test [ ] ≤5 hashtags [ ] CTA correct for phase [ ] Gagan ≥2.

## ENGINE 2 — WhatsApp Community Engine

**Purpose:** The warm home where webinar attendees become trusting members, and trusting members become Accelerator applicants. The highest-intent, highest-trust channel — treated as such.

**Philosophy:** Value-first, never a broadcast spam list. "Advocate, not salesman." A member should get real career help even if they never buy. Selling happens ~10% of the time and feels like the natural next step.

**Engagement strategy:** predictable daily value + weekly rituals + real human replies from founders/mentors. People stay for the rhythm and the realness.

**Weekly framework (ritual calendar):**
| Day | Ritual | Format |
|---|---|---|
| Mon | Motivation + week theme | short founder note |
| Tue | Teach — one MedTech concept/role | micro-lesson + graphic |
| Wed | Discussion prompt | open question, founder replies |
| Thu | Poll or Quiz | interactive, low-effort |
| Fri | Resource drop | template / guide / clip |
| Sat | Member spotlight / Q&A | trust + proof (consent-gated) |
| Sun | Reflection / next-week teaser | light |

**Daily content framework:** 1 value message/day (never more than 2). Each = hook + one useful thing + optional light prompt. No walls of text.

**Value delivery:** micro-lessons, resume tips, role explainers, webinar clips, curated jobs/news, live-session announcements.

**Discussion strategy:** one genuine open question/week where founders reply personally within hours — the reply is the product.

**Poll strategy:** weekly poll doubling as (a) engagement and (b) audience research (feeds LinkedIn/webinar topic selection). *("Which role confuses you most?" → next webinar topic.)*

**Quiz strategy:** monthly "MedTech readiness" mini-quiz — interactive, self-identifying, surfaces warm Accelerator leads.

**Community rituals:** named recurring beats (e.g., "Teach Tuesday," "Resource Friday," monthly live AMA) so membership feels like belonging, not a list.

**Trust-building:** founders visibly present; honest answers including "this isn't for you yet"; zero hype; real names/stories only with consent.

**Conversion strategy:** the Accelerator is introduced only after value is established — a monthly "doors context" message + post-webinar warm invite. Framed as the GTM honest-scarcity line ("we interview before we admit").

**Retention strategy:** the rhythm itself + monthly live touchpoints + making members feel progress. Exit only via graduation to Accelerator or genuine fit-out.

**SOP —** *Inputs:* weekly ritual calendar, webinar clips, poll results. *Outputs:* 7 messages/wk + engagement + warm-lead tags. *Owner:* Community Manager + founder cameos. *Frequency:* daily. *Tools:* WhatsApp, Canva, a member/warm-lead tracker. *Success:* daily active replies, poll participation %, community→Accelerator applications. *Checklist:* [ ] value-first [ ] ≤2 msgs/day [ ] founder reply on discussion day [ ] compliance-clean [ ] CTA only in the ~10% slot.

## ENGINE 3 — Webinar Content Engine (the flywheel core)

**Principle:** one webinar = weeks of content across every channel. Full lifecycle:

**BEFORE (2–3 week runway):** topic selection (from community polls) → landing page + registration → LinkedIn runway (tease → value → segment → founder invite → agenda reveal → honest scarcity → last-call, per the proven cadence) → WhatsApp reminder sequence → email reminders (once list exists).

**DURING:** live poll (audience research + engagement), real story from a guest, live Q&A (unscripted — the trust moment), capture clippable moments, screenshot chat/poll for proof.

**AFTER:** thank-you + replay to registrants → repurposing cascade (Engine 4) → follow-up sequence → testimonials/FAQs harvested from Q&A → community discussion of key takeaways → Accelerator warm invite to attendees.

**Content this generates (per webinar):** replay upload, 3–5 short clips, 2 carousels, founder recap post, quote graphics, community lesson series, FAQ set, newsletter recap, poll-result post. → weeks of assets from one event.

**SOP —** *Inputs:* confirmed topic/date/speakers, registration page. *Outputs:* full lifecycle content + attendee warm list + repurposing raw material. *Owner:* Content Lead (promo) + Founder (delivery) + Community Manager (nurture). *Frequency:* monthly. *Tools:* Zoom, landing page, scheduler, clipping tool. *Success:* registrations, attendance rate, replay views, community joins, Accelerator applications from attendees. *Checklist:* [ ] topic from real audience signal [ ] runway cadence live [ ] compliance on all scarcity claims [ ] recording captured [ ] repurposing brief handed off within 48h.

## ENGINE 4 — Content Repurposing Engine

**Principle:** create long-form once (the webinar / a founder essay), atomize into every format. Nothing is made from scratch that could be repurposed.

**The cascade (one webinar →):**
```
WEBINAR RECORDING
├─ YouTube: full replay + chaptered
├─ LinkedIn: 3–5 native clips, 2 carousels, founder recap, quote cards, poll-result post
├─ WhatsApp: 5-part micro-lesson series, resource clips
├─ FAQ: harvested from live Q&A → website + community
├─ Newsletter: recap article + key lesson (once launched)
├─ Blog/SEO: transcript → article (once launched)
└─ Student resources: checklist / one-pager from the teaching
```

**Repeatable framework:** every long asset gets a "repurposing brief" — a checklist of the 8–10 derivative pieces, owners, and due dates, filled within 48h of the source going live.

**SOP —** *Inputs:* source asset (recording/essay) + transcript. *Outputs:* the derivative set on schedule. *Owner:* Content Lead + Designer. *Frequency:* per major asset (≥monthly). *Tools:* transcription, clipper, Canva, generation spec. *Success:* # of assets shipped per source; % of channels fed. *Checklist:* [ ] transcript done [ ] clips cut [ ] carousels designed [ ] each channel's format produced [ ] scheduled.

## ENGINE 5 — Conversion Engine

**Principle:** content moves people through the funnel deliberately; each stage has a content job. Never sell before trust; always make the next step obvious.

| Stage | Content job | Primary channel | Metric |
|---|---|---|---|
| LinkedIn/YouTube | make careers feel real + reachable | public | reach, reg. clicks |
| Webinar | prove value live, deepen trust | Zoom | attendance, joins |
| WhatsApp | nurture, answer, belong | community | active members, warm tags |
| Trust | honest scarcity, "why we interview" | community + LinkedIn | applications |
| Accelerator | the selective, honest offer | application + call | admit rate, enrolments |
| Alumni | proof + referral | all | verified outcomes, referrals |

**Balance:** the 40/25/25/10 ratio (Part B) governs conversion — promotion only lands because education/authority/community earned it. The Accelerator ask appears once per cycle, warmly, at the point of maximum trust (post-webinar, in-community).

**SOP —** *Inputs:* funnel-stage content map, warm-lead tags. *Outputs:* stage-appropriate CTAs + conversion tracking. *Owner:* Content Lead + Founder (calls). *Frequency:* per cycle. *Tools:* Supabase leads, community tracker, landing pages. *Success:* stage→stage conversion rates; enrolments/cycle. *Checklist:* [ ] every piece has a clear next step [ ] no hard sell outside the 10% [ ] scarcity claims real [ ] warm leads routed to application.

## ENGINE 6 — Analytics Engine

**Metrics to track:**
- *Awareness:* reach, follower growth, profile views, video views.
- *Engagement:* self-identification comments, comment:reaction ratio, poll/quiz participation, saves.
- *Funnel:* webinar registrations + attendance rate, community joins + active %, applications, admit rate, enrolments.
- *Down-funnel (later):* completion, verified placements, referral rate — the flywheel KPI (does each cohort's proof raise next cycle's applications?).

**Weekly review (30 min):** top/bottom post, why; registration + community pace; one adjustment for next week.

**Monthly review (60 min):** pillar performance, funnel conversion rates vs benchmark, winning-content patterns, next month's theme + webinar topic (informed by community polls), one system improvement.

**Success benchmarks (v1 — recalibrate after 2 cycles):** LinkedIn engagement rate ≥ proven page baseline; webinar attendance ≥40% of registrants; community weekly active ≥30%; ≥1 winning post/week to double down on.

**Decision framework:** double down on formats that beat the pillar's median; kill anything matching a banned pattern; let real audience signal (polls, comments, registrations) — not opinion — pick topics.

**How we identify winners:** any post >2× its pillar's rolling median → template it. **How we improve monthly:** every winner becomes a reusable template; every loser's pattern gets logged to the "don't repeat" list.

**SOP —** *Inputs:* channel analytics + tracking sheet. *Outputs:* weekly note + monthly report + next-month decisions. *Owner:* Content Lead. *Frequency:* weekly + monthly. *Tools:* LinkedIn/YouTube analytics, Supabase, a KPI sheet. *Success:* decisions are data-driven and logged; benchmarks trend up. *Checklist:* [ ] metrics pulled [ ] winners/losers tagged [ ] one change committed [ ] topic signal captured.

---

# PART D — THE MASTER CONTENT WORKFLOW

The repeatable monthly loop every engine plugs into:

```
RESEARCH → MONTHLY STRATEGY → WEEKLY PLANNING → CREATION → REVIEW →
DESIGN → PUBLISHING → COMMUNITY ENGAGEMENT → ANALYTICS → OPTIMIZATION → (repeat)
```

1. **Research** *(monthly, Content Lead):* mine community polls, comments, competitor moves, audience questions → the month's real demand signal.
2. **Monthly Strategy** *(Content Lead + Founders):* set the month theme, the webinar topic, the 40/25/25/10 targets, and the funnel goal (registrations + Accelerator target).
3. **Weekly Planning:** break the month into weekly slots per channel (LinkedIn pillar map, WhatsApp ritual calendar, webinar-runway if applicable).
4. **Creation:** draft via the generation spec, in-voice, to the script skeleton — batched, not daily-scrambled.
5. **Review:** compliance gate (fabrication/scarcity/banned templates) + voice check + line-1 hook test. Founder sign-off on their own voice.
6. **Design:** carousels/graphics to `BRAND.md` (Fraunces/Jakarta, navy/blue/cyan, 60·30·10).
7. **Publishing:** schedule to cadence; Gagan carries the reach load; link-in-comments discipline.
8. **Community Engagement:** reply within hours on discussion days; route warm leads; run polls/quizzes.
9. **Analytics:** weekly pull + tag winners/losers.
10. **Optimization:** double down on winners, retire losers, feed learnings into next Research.
11. **Repeat** — the loop compounds because winners become templates and the audience learns the rhythm.

---

# PART E — OPERATING RHYTHM, OWNERSHIP & 12-MONTH SCALE

**Monthly rhythm:** Week 1 plan + create batch; Weeks 2–3 publish + webinar runway; Week 3/4 webinar + repurposing cascade; Week 4 review + next-month plan. One webinar/month is the heartbeat.

**Ownership (minimum viable team, scales later):**
- **Content Lead** — owns strategy, planning, drafting, analytics (the operator).
- **Founders (Gagan/Shilpi)** — voice, authority posts, webinar delivery, community presence, final voice approval.
- **Community Manager** — WhatsApp daily rhythm + engagement (can start as Content Lead, split out as it scales).
- **Designer** — carousels/graphics to brand (can be freelance/AI-assisted early).

**12-month scaling path:**
- **Months 1–3 (Foundation):** lock the LinkedIn + WhatsApp + Webinar loop; monthly webinar; build template banks; activate Gagan fully. Awareness layer only per GTM Phase 1–2.
- **Months 4–6 (Convert):** open Accelerator applications (GTM Phase 3), turn selection into content, launch the email newsletter as a nurture layer, begin YouTube cadence (webinar replays + clips).
- **Months 7–9 (Proof):** publish verified cohort outcomes (GTM Phase 4), scale YouTube, add SEO/blog from transcripts.
- **Months 10–12 (Flywheel):** systematized repurposing, referral/alumni engine, multi-cohort cadence; the OS runs on templates + data, not heroics.

**Every recommendation here is scalable, repeatable, documented, systemized, easy to execute, and easy to improve** — by design.

---

# PART F — WHAT I NEED FROM YOU + BUILD SEQUENCE

**Open inputs to confirm (these firm up the build, not block approval):**
1. Is the **6-week Career Accelerator** the single paid conversion goal, and its real price/cohort-size/cadence?
2. **Webinar frequency** — is monthly the intended heartbeat?
3. **Team reality** — who fills Content Lead / Community Manager / Designer today? (Sizes the SOP detail.)
4. **Shilpi's real background** (still `[FILL]` from the profile rebuild) — needed for her voice authenticity.
5. Newsletter + YouTube — confirm the Months 4–6 / Months 4–9 timing.

**Once this OS is approved, we build each engine in this order** (highest leverage first, matching your stated sequence):
1. **LinkedIn Growth Engine** — pillar bank, month-1 framework, generation workflow.
2. **WhatsApp Community Engine** — ritual calendar + message templates + conversion path.
3. **Webinar Content Engine** — full lifecycle playbook + runway templates.
4. **Content Repurposing Engine** — the repurposing brief + cascade templates.
5. **Conversion Engine** — stage-by-stage CTA library + tracking.
6. **Analytics Engine** — the KPI sheet + review templates.

**Rules honored:** no LinkedIn posts written, no WhatsApp messages written, no content calendar created. This is the operating system only.

---

*Version 1.0 · consolidates the audit of all current assets + the six-engine architecture. Recalibrate after the first full monthly cycle with real data.*
