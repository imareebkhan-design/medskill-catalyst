# MedSkills Catalyst — Security Audit & Remediation

**Date:** 10 August 2026
**Scope:** Next.js 15 app (enrollment + payments, CRM/admin, careers, webinar), Supabase/PostgreSQL, Razorpay, Resend, Meta CAPI.
**Method:** Read-only source review of every security-relevant path, followed by fixes for the confirmed issues. Findings below were verified against the current code, not assumed from an earlier report.

---

## 1. Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Careers storage bucket was **public** — applicant resumes, certificates, portfolios and ID documents were readable by anyone on the internet | **High** (PII exposure) | ✅ Fixed |
| 2 | Admin passcode accepted via **`?passcode=` URL query string** on 4 endpoints — leaks the master passcode into server/CDN logs, browser history and the `Referer` header | **Medium** | ✅ Fixed |
| 3 | **Non-constant-time** passcode comparison (`given === expected`) on those same endpoints | **Low** | ✅ Fixed |
| 4 | Careers-admin passcode held in browser `sessionStorage` (needed by the header-based fetch flow) | **Low** | ⏳ Recommended (needs cookie-session refactor) |
| 5 | Single shared passcode = one shared admin identity; no per-user accountability or true server-side logout | **Medium (design)** | ⏳ Recommended (migrate to Clerk) |
| 6 | No rate limiting / lockout on the passcode endpoints | **Low–Med (hardening)** | ⏳ Recommended |

No SQL injection was found (all database access is parameterised through Prisma or the Supabase client's `.eq()` builder). No XSS sinks were found (`dangerouslySetInnerHTML` is not used anywhere in the app). The Razorpay payment path was reviewed and is sound: amounts are computed server-side, and both the checkout callback and the webhook verify HMAC signatures in constant time with idempotent, replay-safe fulfillment.

---

## 2. Fixes applied in this pass

### 2.1 Careers documents are now private (was High)

**Before:** `/api/careers/apply` created the `careers` bucket with `public: true` and stored a permanent `getPublicUrl()` link for every uploaded file. Anyone with (or guessing) the URL could download an applicant's resume or ID with no authentication.

**After:**
- The bucket is now **private**. `ensureCareersBucketPrivate()` (in `lib/supabase.ts`) creates it private, and — importantly — flips the **existing** production bucket to private via `updateBucket`, so the files that were already exposed stop being publicly downloadable.
- Uploads now store only the **object path**, not a public URL (`src/app/api/careers/apply/route.ts`).
- The admin listing (`/api/careers/admin`) generates a **short-lived signed URL** (1 hour) for each file at read time via `signCareersFile()`. Legacy rows that stored a full public URL are handled too — the path is extracted from the old URL and signed — so the admin view keeps working while public access is closed.

**Files:** `lib/supabase.ts`, `src/app/api/careers/apply/route.ts`, `src/app/api/careers/admin/route.ts`.

### 2.2 Passcode is header-only now (was Medium)

Every admin endpoint previously accepted the passcode from **either** the `x-admin-passcode` header **or** a `?passcode=` query parameter. A passcode in a URL is written to access logs and browser history and can leak via `Referer`. The query-string path was confirmed **unused by any client** (all callers already send the header), so it was removed with no functional change.

**Files:** `src/app/api/careers/admin/route.ts`, `src/app/api/invoices/route.ts`, `src/app/api/invoices/[id]/route.ts`, `src/pages/api/leads.ts`.

### 2.3 Constant-time passcode comparison (was Low)

The passcode checks used JavaScript `===`, which short-circuits on the first mismatched byte and leaks a timing signal. They now use a shared, constant-time helper (`passcodesMatch` / `hasAdminPasscode` in `lib/admin-auth.ts`) built on `node:crypto.timingSafeEqual` — matching the pattern already used by the main `/admin` cookie flow in `src/lib/auth.ts`.

**Files:** new `lib/admin-auth.ts`, plus the four endpoints above.

> Verification: `tsc --noEmit` passes clean, and the Supabase storage APIs used (`createBucket`, `updateBucket`, `getBucket`, `createSignedUrl`) were confirmed against the installed `@supabase/storage-js` types.

---

## 3. Recommended next (not done in this pass)

These need product decisions or larger refactors, so they're listed rather than silently changed:

1. **Move admin auth to Clerk (per-user accounts).** The single shared passcode means every admin action is attributed to one "Admin" record, there's no real server-side logout (deleting the cookie is client-side only; the token stays valid until its 12-hour expiry), and roles in the schema aren't enforced. Clerk is already a dependency — wiring it in and protecting `/admin(.*)` + `/api/**` admin routes with a `middleware.ts` would resolve findings 4, 5 and 6 together.
2. **Stop holding the passcode in `sessionStorage`.** Once the careers admin uses a real server session (cookie or Clerk), the client no longer needs to keep the passcode to re-send it.
3. **Add rate limiting** on the passcode endpoints (Vercel WAF rule or a small IP limiter) to blunt brute-force attempts against the shared passcode.
4. **Review dependency advisories** (`npm audit`) and schedule upgrades for `next` and the storage/image libraries. These are largely DoS-class and lower priority than the items above, but worth a maintenance pass.

---

## 4. What was checked and found OK

- **Payments (Razorpay):** server-side order amounts, HMAC verification on both the callback and the webhook, raw-body signature check, event de-duplication, and idempotent fulfillment that safely retries. No client-trusted amounts.
- **Enrollment uploads (`/api/enroll/upload`):** private bucket, gated to a live enrollment token or an active course, with MIME/extension allow-listing and random object keys.
- **Secrets:** all server secrets are env vars; none are committed (`.gitignore` covers `.env*`, only `.env.example` is tracked). Server-only modules are marked `import "server-only"`.
- **Injection:** parameterised DB access throughout; no raw SQL string building; no `dangerouslySetInnerHTML`.
