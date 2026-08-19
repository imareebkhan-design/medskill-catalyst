# WhatsApp Message Templates — Cohort 1 Batch 2 (BSP-safe)

Rebuilt for submission through a third-party dashboard (Wati / AiSensy / Interakt / Twilio / 360dialog).

**Copy the text blocks exactly as written.** They are plain ASCII with numbered variables, no header variables, and no mixed button types — the four things that cause `INVALID_FORMAT` on BSP validators.

---

## Why the earlier version was rejected

| Cause | Fix applied |
|---|---|
| Named variables `{{first_name}}` | Changed to numbered `{{1}}`, `{{2}}`. Named format is newer Cloud API only; BSP dashboards reject it. |
| Variable at the end of the header | Header is now static text with no variable at all. |
| `·` and `—` characters | All punctuation is plain ASCII. No em dashes, middle dots, curly quotes, arrows, or bullet glyphs. |
| 2 URL buttons + 1 quick reply | URL buttons only. Opt-out moved into the footer text. |
| `|` in "Cohort 1 \| Batch 2" | Written as "Cohort 1 Batch 2". Pipes are safe on most validators but not all — not worth the risk. |

**If you retype rather than paste:** watch for smart quotes. Word and Google Docs auto-convert `'` into `'`, which some validators reject. Paste into a plain-text editor first if you edit anything.

---

## 0. Foundation Module announcement — MARKETING (submit this one first)

The main send. Goes to masterclass registrants, announces Batch 2, and leads on the Foundation Module as the thing they are actually buying into first.

Module content is drawn from `AdScript_Foundation_Gagan_Aug2026.md` and `Recording_Script_Foundation_Module_GaganVictor.md` — the device map, Class A to D, Indian manufacturers, MedTech hubs, where the roles sit. Nothing invented.

**Template name:** `foundation_module_batch2`
**Category:** Marketing
**Language:** English

### Form fill sheet

Every field your dashboard will ask for, in order.

| Field | What to enter |
|---|---|
| Template name | `foundation_module_batch2` |
| Category | Marketing |
| Language | English |
| Header type | Text |
| Header text | `Foundation Module enrolment is open` |
| Body | see below |
| Sample for `{{1}}` | `Ananya` |
| Sample for `{{2}}` | `15 August` |
| Footer | `Team MedSkills Catalyst. Reply STOP to opt out.` |
| Button 1 | Visit Website, `Book a discovery call` |
| Button 2 | Visit Website, `Enrol now` |

### Header

Static text, no variable. 35 of the 60 characters allowed.

```
Foundation Module enrolment is open
```

Two alternatives if you prefer a different emphasis:

```
Cohort 1 Batch 2 starts 15 August
```

```
Your MedSkills Catalyst update
```

The first alternative hardcodes the date, so you would need a new template for Batch 3. The recommended one and the second alternative are reusable across every batch.

**Why no variable in the header:** header and body variables are numbered separately in Meta's own API — both start at `{{1}}` — but several BSP dashboards number them continuously instead, so a header variable becomes `{{1}}` and your first body variable silently becomes `{{2}}`. That mismatch is a common `INVALID_FORMAT` cause. A static header removes the problem. It also removes the risk of a variable landing at the end of the header, which is rejected outright.

### Footer

```
Team MedSkills Catalyst. Reply STOP to opt out.
```

46 of the 60 characters allowed. **Footers cannot contain variables** — WhatsApp only supports them in the header and body. If your dashboard offers a sample-value field for the footer, leave it empty.

### Sample values

Your dashboard will ask for one sample per body variable. These are what the reviewer sees, so they must look like real data.

| Variable | Stands for | Sample to enter |
|---|---|---|
| `{{1}}` | Recipient first name | `Ananya` |
| `{{2}}` | Batch start date | `15 August` |

Two rules on these. First, the sample must match the format you will actually send — if your CRM pushes `15th August 2026`, enter that, not `15 August`. A mismatch between sample and live data is grounds for a quality flag later. Second, never use `xxx`, `test`, `abc`, or `Name`. Placeholder junk in a sample field gets templates rejected on its own.

**Body**

```
Hi {{1}}, you registered for the MedSkills Catalyst Masterclass, so we wanted to share an update with you.

Cohort 1 Batch 2 starts on {{2}}, opening with our Foundation Module.

The Foundation Module is where you build your map of the industry: device categories from Class A to Class D, who manufactures them in India, where the MedTech hubs are, and where the roles sit. It is the groundwork most people spend two years picking up by trial and error.

Book a discovery call and our team will take you through the module in detail. If you have already decided, use the enrolment link to confirm your seat.
```

**Sample values**

- `{{1}}` = `Ananya`
- `{{2}}` = `15 August`

**Footer**

```
Team MedSkills Catalyst. Reply STOP to opt out.
```

**Buttons** — type: Visit Website (add two)

| Button text | URL |
|---|---|
| `Book a discovery call` | `PLACEHOLDER_DISCOVERY_CALL_URL` |
| `Enrol now` | `PLACEHOLDER_ENROL_URL` |

### Shorter variant

Same message, tighter. Use this if you want the fastest possible review, or if your BSP allows only one button.

```
Hi {{1}}, you registered for the MedSkills Catalyst Masterclass, so here is an update.

Cohort 1 Batch 2 starts on {{2}}, opening with our Foundation Module: the device map from Class A to Class D, who manufactures in India, where the MedTech hubs are, and where the roles sit.

Book a discovery call to hear more, or use the enrolment link to confirm your seat.
```

Same sample values, same footer, same buttons.

### Note on the "two years" line

"It is the groundwork most people spend two years picking up by trial and error" comes from the approved ad script, but it is a claim about other people's experience rather than a promise about outcomes, which is why it passes. If your BSP reviewer queries it, delete that one sentence. Everything else in the body is factual description of curriculum and will not be challenged.

**Why this clears review:** no header to validate, no claims about jobs, salaries, or placement, an opt-out in the footer, plain ASCII throughout, and variables sitting mid-sentence rather than at the edges. The only components a reviewer has to pass are body, footer, and two standard URL buttons.

---

## 1. Batch reopen — MARKETING

**Template name:** `cohort_batch_reopen`
**Category:** Marketing
**Language:** English

**Header** — type: Text (static, no variable)

```
Cohort 1 Batch 2 Enrolment
```

**Body**

```
Hi {{1}}, you registered for our Masterclass recently, so you are on our list for Cohort 1 Batch 2, starting {{2}}.

Before you consider it: this is not for everyone. It suits healthcare professionals who have decided MedTech is the direction and want a structured route in. It does not suit anyone still deciding whether to leave clinical practice.

If that first description is you, book a discovery call and our team will go through your specifics, answer your questions, and tell you honestly whether this is a good fit.

If you have already decided, you can enrol and complete payment to confirm your seat.
```

**Sample values** (the dashboard will ask for these)

- `{{1}}` = `Ananya`
- `{{2}}` = `15 August`

**Footer**

```
Team MedSkills Catalyst. Reply STOP to opt out.
```

**Buttons** — type: Visit Website (add two)

| Button text | URL |
|---|---|
| `Book a discovery call` | `PLACEHOLDER_DISCOVERY_CALL_URL` |
| `Enrol now` | `PLACEHOLDER_ENROL_URL` |

---

## 2. Discovery call booked — UTILITY

**Template name:** `discovery_call_booked`
**Category:** Utility

**Body**

```
Hi {{1}}, your discovery call with MedSkills Catalyst is confirmed for {{2}}.

It runs about 20 minutes. We will walk through your background, where you want to go in MedTech, and whether Cohort 1 Batch 2 is the right route for you.

Come with your questions. If you need to move the slot, use the link below.
```

- `{{1}}` = `Ananya`
- `{{2}}` = `Tuesday 5 August, 6:30 PM IST`

**Footer**

```
Team MedSkills Catalyst
```

**Buttons** — Visit Website

| Button text | URL |
|---|---|
| `Reschedule` | `PLACEHOLDER_DISCOVERY_CALL_URL` |

---

## 3. Discovery call reminder — UTILITY

**Template name:** `discovery_call_reminder`
**Category:** Utility

**Body**

```
Hi {{1}}, a reminder that your MedSkills Catalyst discovery call is at {{2}} today.

Your joining link is {{3}} and we will be ready a few minutes early.

If something has come up, reply here and we will find you another slot.
```

- `{{1}}` = `Ananya`
- `{{2}}` = `6:30 PM IST`
- `{{3}}` = `meet.google.com/abc-defg-hij`

**Footer**

```
Team MedSkills Catalyst
```

No buttons.

---

## 4. Enrolment confirmed — UTILITY

**Template name:** `enrolment_confirmed`
**Category:** Utility

**Body**

```
Welcome aboard {{1}}. Your seat in Cohort 1 Batch 2 is confirmed.

Programme starts: {{2}}
Payment reference: {{3}}

Your onboarding pack and joining details are on their way to {{4}}. If you do not see them within 24 hours, reply here and we will sort it out.
```

- `{{1}}` = `Ananya`
- `{{2}}` = `15 August`
- `{{3}}` = `MSC-B2-004192`
- `{{4}}` = `ananya@example.com`

**Footer**

```
Team MedSkills Catalyst
```

No buttons.

---

## 5. Final seats — MARKETING

**Template name:** `cohort_batch_final_seats`
**Category:** Marketing

**Body**

```
Hi {{1}}, enrolment for Cohort 1 Batch 2 closes on {{2}}.

We keep batches small so every participant gets real mentor time, which means the number of seats is fixed.

If you are still weighing it up, a discovery call is the fastest way to get a straight answer on whether this is right for you. If it is not, we will tell you.
```

- `{{1}}` = `Ananya`
- `{{2}}` = `7 August`

**Footer**

```
Team MedSkills Catalyst. Reply STOP to opt out.
```

**Buttons** — Visit Website

| Button text | URL |
|---|---|
| `Book a discovery call` | `PLACEHOLDER_DISCOVERY_CALL_URL` |
| `Enrol now` | `PLACEHOLDER_ENROL_URL` |

---

## Audit against Meta's official rejection criteria

Checked line by line against Meta's published template review documentation.

| Meta's stated rejection reason | Our template |
|---|---|
| Missing or mismatched curly braces; format must be `{{1}}` | Pass. Numbered format throughout. |
| Variables containing special characters like `#`, `$`, `%` | Pass. Variables carry a name and a date, nothing else. |
| Variables not sequential, e.g. `{{1}}, {{2}}, {{5}}, {{4}}` | Pass. `{{1}}` then `{{2}}`. |
| Too many variables relative to message length | Pass. Two variables across roughly 600 characters. |
| Template starts or ends with a parameter (dangling parameters) | Pass. Body opens with "Hi " and closes on a full sentence. |
| Commerce Policy violation | Pass. No goods sold in-message, no prices, no payment collection in the template. |
| Business Policy violation — requesting sensitive identifiers | Pass. Nothing requested from the recipient. |
| Abusive or threatening content | Pass. |
| Character limits | Pass. Header 35/60, footer 46/60, body well under 1024, buttons under 25. |
| Duplicate body **and** footer of an existing template | Pass, with a caveat — see below. |
| Missing sample values | Pass, provided you click Add Sample before submitting. |

### The duplication rule, and where it could bite you

A template is rejected as a duplicate only when **both the body and the footer** match an existing template. All the templates in this file share the footer `Team MedSkills Catalyst` or a variant of it, but every body is different, so none of them collide.

The place to be careful is the shorter variant in section 0. It shares a footer with the full version, so if you ever trim the full body down to match the short one, the second submission will be rejected as a duplicate. Submit one or the other, or keep the bodies clearly distinct.

### Correction to earlier advice

I previously told you that non-ASCII characters like em dashes and middle dots in body text were a likely cause of your rejection. Meta's published criteria do not support that. The special-character rule applies to **variable parameters**, not body text, and body text with an em dash in it is fine.

The two documented rules your rejected template did break:

1. **Dangling parameter.** The header read `Cohort 1 · Batch 2 starts {{start_date}}` — it ended on a variable. Meta rejects this outright.
2. **Named variables.** Meta's documented positional format is `{{1}}`. Named parameters are supported only on newer Cloud API versions and most BSP dashboards reject them as malformed.

Everything in the current file already avoids both. Keeping the plain-ASCII approach costs nothing, so I have left it in place, but it was not your problem.

### Find out exactly why it was rejected

Your BSP showed you a bare `INVALID_FORMAT`. Meta records the real reason, and you can read it directly:

**Business Support Home → Account Overview → View my accounts → your Meta Business Account → your WhatsApp Business Account → Rejected message templates**

The same detail goes to your Business Suite admins by email. Worth checking before you resubmit — it will tell you in one line whether my diagnosis above was right.

### Appeals

If you would rather appeal the existing rejection than submit fresh, you can. Two things to know: appeals **must include a sample**, and a decision comes within 24 hours. Editing the rejected template and resubmitting is usually faster than arguing the original.

## Other rules worth keeping

**Category**

- Anything promoting a batch, offer, or event to a list is Marketing.
- Only messages triggered by a specific action the person took (booking, paying, a reminder for a thing they signed up for) are Utility.
- Getting this wrong causes recategorisation, and repeat offences flag the account.

**Formatting**

- No markdown. WhatsApp uses `*bold*` and `_italic_`, not `**bold**`.
- Emoji count in the body is limited. Our templates use none.
- Maximum 2 URL buttons. Do not mix URL buttons with quick replies on a BSP.

**Timing**

- Review can take up to 24 hours. With Batch 2 starting on the 8th, submit today.
- Approval sets status to Active - Quality pending. You can send immediately at that point.
- Set up the `message_template_status_update` webhook so a later pause does not surprise you mid-campaign.

---

## If it still comes back rejected

Submit template 3 first. It is body-only, no buttons, no header — the smallest possible surface area. If that one passes, the problem is in the header or buttons. If even that fails, the problem is upstream of the copy: an unverified business portfolio, a display name still pending approval, or a BSP account not fully provisioned. At that point it is a support ticket with your BSP, not a copy problem.

---

## Still needed before you submit

- [ ] Real discovery call URL, replacing `PLACEHOLDER_DISCOVERY_CALL_URL`
- [ ] Real enrolment URL, replacing `PLACEHOLDER_ENROL_URL`
- [ ] Confirm your BSP supports two URL buttons. A few allow only one, in which case keep `Book a discovery call` and move the enrol link into the body text.
