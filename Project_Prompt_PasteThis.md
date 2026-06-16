# Prompt to paste into your Claude Project

**Setup (do once):** Upload to the Project's knowledge — `MedSkills_Content_Engine_Spec.md`, `MedSkills_4July_Campaign_Calendar.md`, and your trained dataset (swipe file + competitor reports + top-performing posts). Then use the prompts below in the chat.

**Fill these in before first use:**
- Registration link: `__________`
- Masterclass roles/agenda (in order): `__________`
- Today's date: `__________`

---

## PROMPT 1 — Build / confirm the content calendar
*(Use once at the start, or to re-plan. Skip if the calendar in knowledge is already final.)*

```
You are the MedSkills Catalyst content engine. Goal: drive registrations for the free MedTech careers masterclass on 4 July 2026 (hosted by Gagan Victor), while educating the audience.

Using the Content Engine Spec and the 4-July Campaign Calendar in your knowledge, produce a finalised day-by-day posting calendar from [TODAY'S DATE] to 4 July.

For each day give: date | voice (Gagan / Shilpi / Company Page) | topic or role being decoded | hook type | ICP | CTA intensity (soft/medium/hard).

Rules:
- Phases: Educate & Announce → Decode Roles → Convert → Day-of, with registration pressure escalating toward 4 July.
- The role-decode posts must match my real agenda: [PASTE YOUR MASTERCLASS ROLES IN ORDER].
- Weekends = amplify-only (no new post); founders reshare with a personal line.
- One new post per day; double up only in the final 3 days.

Output the calendar as a clean table. Then stop and wait for me to ask for individual posts.
```

---

## PROMPT 2 — Write a single post (the one you'll use daily)

```
Write the post for [DATE] from the calendar: [VOICE] · [HOOK TYPE] · [ICP] · [TOPIC/ROLE].

Follow the Content Engine Spec exactly:
- Voice = [Gagan = senior-insider authority, first person / Shilpi = warm mentor, ICP-1 empathy / Company Page = sharp, numbered, neutral hub].
- Structure: Hook (a number or a reframe in line 1 — no throat-clearing) → name the ICP's exact pain → reframe/teach → one piece of REAL proof (named roles/companies or IBEF-sourced ranges only) → CTA.
- CTA intensity = [soft/medium/hard]. Every campaign post routes to the masterclass. Registration link: [PASTE LINK]. End with one self-identification question to drive comments.
- Hinglish where the emotion lands; English for technical credibility.
- Max 3–5 relevant hashtags. Short lines, white space.

Hard bans: the "[skill] is important ✅✅✅" template, hashtag dumps, generic motivational filler, fabricated placements/salaries/outcomes, fake scarcity.

Give me the ready-to-paste post. If it's a carousel, give slide-by-slide copy + the caption. Tell me the voice, ICP, and phase at the top.
```

---

## PROMPT 3 — Generate ideas first (optional, when you want options)

```
Give me 5 post ideas for [DATE / role / theme]. For each:
Idea # — [Hook type] — [Voice] — [ICP]
Hook line: "<the actual first line>"
Angle: <one sentence on the teach/reframe>
Proven pattern: <which dataset/page post it echoes>
CTA fit: <soft/medium/hard>

Then wait. When I say "write idea N", produce the full post using the Content Engine Spec rules.
```

---

**Tip:** keep one Project chat thread for the whole campaign so it remembers what's already been posted and doesn't repeat hooks.
