# MedTech 101 — Registration Form (Google Form → Google Sheet)

*Build this in ~5 minutes. It auto-feeds a Google Sheet, gives you a link for `{{REGISTRATION_LINK}}`, and segments registrants by ICP so you can nurture them after.*

---

## WHY GOOGLE FORM
- Connects to Google Sheets natively (one click) — every registration lands in a row automatically.
- Free, mobile-friendly, gives a clean shareable link.
- No code, nothing to maintain before 4 July.

---

## STEP-BY-STEP

1. Go to **forms.google.com** → **Blank form**.
2. **Title:** `MedTech 101: Your First Step into the Industry — Free Masterclass`
3. **Description:**
   > 📅 4 July 2026 · 🕕 6:00 PM IST · Free · Live
   > Hosted by Gagan Victor (25 yrs across Pfizer, BMS, Medtronic, Stryker).
   > The real MedTech roles that hire from a pharma background — and the honest difficulty of getting into each. Register below; we'll send the joining link by email + WhatsApp.
4. Add the questions below.
5. Top-right **Settings** → turn ON **"Collect email addresses"** (Verified). Leave "Limit to 1 response" OFF (don't force Google sign-in — it kills conversion).
6. **Settings → Presentation → Confirmation message:**
   > 🎉 You're registered for MedTech 101! Save the date — 4 July, 6:00 PM IST. We'll send your joining link by email and WhatsApp. See you there.
7. Go to the **Responses** tab → green Sheets icon **"Link to Sheets"** → **Create new spreadsheet**. Done — registrations now flow into that sheet live.
8. **Send** (top right) → click the **link icon 🔗** → tick **"Shorten URL"** → copy. **That copied link is your `{{REGISTRATION_LINK}}`** — paste it into every post and the poster.

---

## THE QUESTIONS (keep it short = more registrations)

**Required (4 only):**

1. **Full name** — Short answer — *Required*
2. **Email** — (auto, via "Collect email addresses")
3. **WhatsApp number** — Short answer — *Required*
   - Description: "We'll send the joining link + reminder here (add +91)."
4. **Which best describes you?** — Multiple choice — *Required*
   - Final-year / recent graduate (B.Pharm, M.Pharm, BSc, MBA)
   - Working professional (MR / lab / hospital / pharma)
   - Currently a student
   - Other

**Optional (don't make required — friction kills sign-ups):**

5. **Your background / degree** — Multiple choice
   - B.Pharm · M.Pharm · BSc Life Sciences · MBA · Other
6. **City** — Short answer
7. **What's the one career question you want answered on the day?** — Paragraph
   - *(Gold: this gives you ICP language for content AND lets Gagan answer real questions live.)*

> Q4 + Q5 are your ICP tags — they let you tell ICP-1 (fresh grads) from ICP-2 (working pros) in the sheet and follow up differently. Q7 doubles as content fuel and a self-identification hook.

---

## AFTER YOU HAVE THE LINK
- Drop it into `{{REGISTRATION_LINK}}` in the announcement post and the poster prompt.
- Set a WhatsApp/email reminder to registrants 24h before and 1h before (biggest driver of actual attendance vs. registration).

---

## OPTIONAL UPGRADE — branded registration page
If you want a registration page that matches the poster (cream + brand blue, your logo) instead of the standard Google Form look, I can build a branded HTML landing page that writes into the same Google Sheet via a Google Apps Script. It's more setup (you deploy a script once), but it looks fully on-brand. Say the word and I'll build it.
