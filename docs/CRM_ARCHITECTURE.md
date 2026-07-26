# Medskills Catalyst — CRM & Enrollment Management System
## Architecture Blueprint v1.0 (Design Only — No Code)

> **Status:** Proposed architecture. Nothing here is implemented yet.
> **Author context:** Designed to eventually serve thousands of students, starting lean.
> **Existing state:** The current repo is a static-HTML marketing site + Supabase-backed Phase 1 invoicing (`/admin`, `/invoice`, passcode auth). This document designs the **next-generation platform** that replaces/absorbs it. See §11 for the migration path.

---

## 1. System Overview

A single Next.js (App Router) monolith deployed on Vercel, structured as **modular vertical slices** so any module can later be extracted into its own service without rewrites.

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE                          │
│  (CDN, Routing Middleware: auth gate, rate limit, locale)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      ┌────────▼────────┐            ┌────────▼────────┐
      │  PUBLIC APP     │            │  ADMIN CRM APP  │
      │  (marketing,    │            │  (staff-only    │
      │  enroll, pay,   │            │  dashboard)     │
      │  student portal)│            │                 │
      └────────┬────────┘            └────────┬────────┘
               │       Next.js API Routes      │
      ┌────────▼──────────────────────────────▼────────┐
      │              SERVICE LAYER (modules)            │
      │  leads · enrollments · payments · invoices ·    │
      │  courses · comms · documents · reporting        │
      └───┬──────┬──────────┬──────────┬──────────┬─────┘
          │      │          │          │          │
     ┌────▼──┐ ┌─▼────┐ ┌───▼───┐ ┌────▼───┐ ┌────▼─────┐
     │Postgres│ │Clerk │ │Razorpay│ │Resend │ │Cloudflare│
     │(Prisma)│ │Auth  │ │Payments│ │Emails │ │R2 Storage│
     └────────┘ └──────┘ └────────┘ └───────┘ └──────────┘
```

**Key architectural decisions (the "why"):**

| Decision | Choice | Rationale |
|---|---|---|
| App topology | Single Next.js monolith, modular slices | One deploy, one repo, zero infra overhead at this stage; slices keep extraction cheap later |
| Data access | Prisma → Postgres, repository-free (services call Prisma directly) | Prisma's typed client *is* the repository; an extra layer is ceremony at this scale |
| Auth | Clerk with two user classes (staff vs students) via Organizations + roles | Buy-not-build for auth; Clerk handles MFA, sessions, magic links |
| Money math | Server-side only, integer paise, never floats | GST/rounding correctness; client never computes totals |
| Async work | Vercel Queues / QStash for webhooks-triggered jobs (emails, PDFs) | Keeps request handlers < 1s; retries for free |
| PDF generation | Puppeteer via `@sparticuz/chromium` in a dedicated Node function (or fallback: a small Render/Railway worker) | Puppeteer is heavy; isolate it so it can't slow the main app |

---

## 1.5 The Canonical Funnel (source of truth for all statuses)

Every entity status in the system maps to exactly one stage of this funnel. If a feature doesn't move someone down this funnel, it doesn't get built.

| # | Funnel stage | System event | Entity & status |
|---|---|---|---|
| 1 | Organic / Google Ads / Meta Ads | Visitor lands with UTM/gclid/fbclid captured | — (attribution params carried in form) |
| 2 | **Lead Captured** | Form/WhatsApp/manual → `POST /api/leads` | `Lead: NEW` (+ `source`, `attribution Json`) |
| 3 | **CRM Dashboard** | Lead appears in pipeline, assigned to counselor | `Lead: NEW → CONTACTED` |
| 4 | **Discovery Call** | Counselor logs call outcome | `Lead: DISCOVERY_CALL` (+ Activity `CALL`) |
| 5 | **Qualified** | Counselor marks qualified, picks course/batch | `Lead: QUALIFIED` |
| 6 | **Send Enrollment Link** | One click in CRM → tokenized link via email/WhatsApp | `EnrollmentLink: SENT`, `Lead: LINK_SENT` |
| 7 | **Student Fills Form** | Student opens link, completes enrollment form | `Student` created, `Enrollment: PAYMENT_PENDING` |
| 8 | **Payment** | Razorpay checkout on same page; webhook confirms | `PaymentTransaction: CAPTURED`, `Enrollment: CONFIRMED`, `Lead: CONVERTED` |
| 9 | **Invoice Generated** | Auto, from webhook | `Invoice: ISSUED` (+ PDF in R2) |
| 10 | **Invoice Sent** | Auto email w/ PDF (Resend) | `CommunicationLog: SENT` |
| 11 | **Student Onboarding** | Auto welcome sequence + checklist | `Enrollment: ONBOARDING` |
| 12 | **Course Access** | Access granted (portal/WhatsApp group/LMS link) | `Enrollment: ACTIVE` |

**Funnel analytics requirement:** because every stage is a recorded status transition with a timestamp (`Activity` / `AuditLog`), stage-to-stage conversion rates and time-in-stage per source (Organic vs Google vs Meta) are plain SQL — this powers the ad-spend ROI view on the dashboard.

---

## 2. Modules (Vertical Slices)

Each module owns its **routes, services, validation schemas, and Prisma models**. Modules talk to each other only through service functions — never by reaching into another module's tables directly.

### 2.1 Leads & CRM Core
- Capture from website forms (Organic), Google Ads / Meta Ads landing pages, WhatsApp click-to-chat, manual entry, CSV import. Every capture stores `source (ORGANIC | GOOGLE_ADS | META_ADS | WHATSAPP | REFERRAL | MANUAL | IMPORT)` + raw `attribution Json` (utm_*, gclid, fbclid, landing page, referrer).
- Lead lifecycle (mirrors funnel §1.5): `NEW → CONTACTED → DISCOVERY_CALL → QUALIFIED → LINK_SENT → CONVERTED | LOST` (LOST allowed from any stage, with reason).
- Activity timeline (calls, notes, emails, status changes) — append-only `Activity` table.
- Assignment: leads assigned to a counselor (staff user); round-robin optional later.
- Duplicate detection on phone/email at ingest (upsert with merge strategy — already proven in Phase 1).

### 2.2 Courses & Batches
- `Course` = catalog entity (name, description, price, GST rate, duration, mode).
- `Batch` = a scheduled run of a course (start date, seat capacity, schedule, status).
- Seat counting is derived from confirmed enrollments — never a mutable counter (prevents drift).

### 2.3 Enrollments & Enrollment Links
- **Enrollment Link is the conversion instrument** (funnel steps 6–8): when a lead is QUALIFIED, the counselor clicks "Send Enrollment Link" → system creates a single-use, expiring token (`EnrollmentLink`) bound to that lead + chosen course/batch + price (incl. any approved discount), and sends it via email and/or WhatsApp.
- Student opens `/enroll/[token]`: form pre-filled from lead data (name/email/phone locked or editable per config), collects remaining details (address for GST invoice, qualification, documents optional) → submit creates `Student` + `Enrollment(PAYMENT_PENDING)` → Razorpay checkout renders on the same page. No student account/login required to pay — Clerk portal signup is invited *after* payment (funnel must have zero friction before money).
- Link safety: token is 32+ random bytes, expires (default 7 days), single-use, revocable from CRM, price server-bound (student cannot alter amount).
- Enrollment lifecycle: `PAYMENT_PENDING → CONFIRMED → ONBOARDING → ACTIVE → COMPLETED | WITHDRAWN | DEFERRED`.
- Supports installment plans (payment schedule rows linked to the enrollment); first installment confirms.

### 2.4 Payments (Razorpay)
- Razorpay Orders API: server creates order → client checkout → **webhook is the source of truth** (never the client redirect).
- Handles: full payment, installments, partial payments, refunds, failed-payment retry links.
- Every money event is an immutable `PaymentTransaction` row; enrollment status is derived from the ledger.
- Payment links (Razorpay Payment Links) for counselor-initiated collection over WhatsApp.

### 2.5 Invoicing
- Carries forward Phase 1 semantics: atomic numbering `MS/FY/seq` (Indian fiscal year Apr–Mar), server-side GST math, HSN/SAC, bill state, amount-in-words.
- Auto-generated on successful payment (webhook → invoice service) or manual from CRM.
- PDF via Puppeteer rendering the existing pixel-perfect HTML template; stored in R2; emailed via Resend.

### 2.6 Communications
- Transactional email (Resend + React Email templates): enrollment confirmation, payment receipt + invoice PDF, payment reminders, batch start reminders.
- All sends logged to a `CommunicationLog` (audit + "did they get the email?" support queries).
- WhatsApp: Phase 1 = deep links (`wa.me`); Phase 2 = WhatsApp Business API provider (Interakt/Gupshup) behind the same comms service interface.

### 2.7 Documents & Storage (R2)
- Student documents (ID proof, certificates), invoice PDFs, CSV exports.
- **Presigned URLs only** — the bucket is private; upload and download both go through short-lived signed URLs issued by the API after an authorization check. Files never transit the Next.js server.
- Key scheme: `{env}/{module}/{entityId}/{uuid}-{filename}`.

### 2.8 Student Portal (later phase, designed for now)
- Students sign in (Clerk), see their enrollments, payment history, download invoices/receipts, pay pending installments.
- Same app, separate route group — not a separate deployment.

### 2.8b Onboarding & Course Access (funnel steps 11–12)
- Triggered automatically on `Enrollment → CONFIRMED` (webhook pipeline): welcome email sequence (Resend), onboarding checklist on the enrollment record (docs submitted, WhatsApp group joined, portal account created), batch-start details.
- **Course access** v1 = automated delivery of access artifacts: private WhatsApp group invite + course material links + (optional) Clerk portal invite. LMS is an integration point behind `access.grant(enrollment)` — if a real LMS arrives later (Graphy/Teachable/custom), only that one service function changes.
- `Enrollment → ONBOARDING → ACTIVE` transitions are automatic (access granted) but visible/overridable in CRM.

### 2.9 Reporting & Dashboard
- Operational dashboard: pipeline funnel, revenue this month, pending payments, upcoming batches, counselor leaderboard.
- All reports are SQL views/aggregates over the transactional tables — no separate analytics store until data volume demands it.

### 2.10 Admin & Settings
- Staff management (roles via Clerk), course catalog CRUD, tax/invoice settings (GSTIN, address, numbering), email template management, audit log viewer.

---

## 3. Folder Structure

```
medskills-platform/
├── prisma/
│   ├── schema.prisma              # single source of truth for DB
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/              # marketing + enrollment funnel
│   │   │   ├── page.tsx
│   │   │   ├── courses/[slug]/
│   │   │   └── enroll/[batchId]/  # apply → pay flow
│   │   ├── (student)/             # Clerk-gated student portal
│   │   │   └── portal/
│   │   │       ├── enrollments/
│   │   │       ├── payments/
│   │   │       └── documents/
│   │   ├── (crm)/                 # Clerk-gated, staff-role-gated
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── leads/
│   │   │       ├── students/
│   │   │       ├── courses/
│   │   │       ├── batches/
│   │   │       ├── enrollments/
│   │   │       ├── payments/
│   │   │       ├── invoices/
│   │   │       └── settings/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── razorpay/route.ts
│   │   │   │   └── clerk/route.ts
│   │   │   ├── leads/...
│   │   │   ├── enrollments/...
│   │   │   ├── payments/...
│   │   │   ├── invoices/...
│   │   │   └── uploads/presign/route.ts
│   │   └── layout.tsx
│   ├── modules/                   # ← the heart of the architecture
│   │   ├── leads/
│   │   │   ├── service.ts         # business logic (only place that touches Prisma for leads)
│   │   │   ├── schemas.ts         # Zod validation (shared client+server)
│   │   │   ├── queries.ts         # read-model helpers for RSC pages
│   │   │   └── components/        # module-scoped UI
│   │   ├── enrollments/…
│   │   ├── payments/…
│   │   ├── invoices/…
│   │   ├── courses/…
│   │   ├── comms/…
│   │   ├── documents/…
│   │   └── reporting/…
│   ├── lib/                       # cross-cutting, module-agnostic
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # Clerk helpers, requireRole()
│   │   ├── razorpay.ts            # SDK client + signature verify
│   │   ├── resend.ts
│   │   ├── r2.ts                  # S3-compatible client + presign
│   │   ├── money.ts               # paise math, GST, amount-in-words
│   │   ├── api.ts                 # route handler wrapper (auth+validate+errors)
│   │   └── audit.ts
│   ├── emails/                    # React Email templates
│   ├── components/ui/             # shadcn/ui primitives
│   └── middleware.ts              # Clerk middleware + route protection
├── services/pdf/                  # (optional) isolated Puppeteer worker
├── vercel.ts
└── .env.example
```

**Rule of extension:** a new feature = a new folder in `modules/` + route groups in `app/`. Nothing else changes.

---

## 4. Database Schema (Prisma → PostgreSQL)

Conceptual schema — entities, key fields, and relationships. All money in **integer paise**. All tables get `id (cuid)`, `createdAt`, `updatedAt`.

### Identity & staff
- **StaffUser** — `clerkUserId (unique)`, `name`, `email`, `role (ADMIN | COUNSELOR | ACCOUNTS | VIEWER)`, `isActive`. Mirrors Clerk via webhook; DB is authority for CRM role.
- **Student** — `clerkUserId (unique, nullable until portal signup)`, `name`, `email`, `phone (unique)`, `whatsapp`, `city/state`, `qualification`, `extra Json`. Created when a lead converts.

### CRM
- **Lead** — `name`, `email`, `phone`, `source (ORGANIC | GOOGLE_ADS | META_ADS | WHATSAPP | REFERRAL | MANUAL | IMPORT)`, `attribution Json` (utm_source/medium/campaign/term/content, gclid, fbclid, landingPage, referrer), `status (NEW | CONTACTED | DISCOVERY_CALL | QUALIFIED | LINK_SENT | CONVERTED | LOST)`, `lostReason?`, `assignedToId → StaffUser`, `courseInterestId → Course`, `convertedStudentId → Student?`, `extra Json`. Unique on `phone` (upsert-merge on re-capture).
- **Activity** — append-only. `leadId?`, `studentId?`, `enrollmentId?`, `type (NOTE | CALL | STATUS_CHANGE | EMAIL | SYSTEM)`, `body`, `actorId → StaffUser?`. Powers every timeline in the UI.

### Catalog
- **Course** — `name`, `slug`, `description`, `basePricePaise`, `gstRatePct`, `hsnSac`, `durationWeeks`, `mode (ONLINE | OFFLINE | HYBRID)`, `isActive`.
- **Batch** — `courseId`, `name`, `startDate`, `endDate`, `seatCapacity`, `status (PLANNED | ENROLLING | RUNNING | COMPLETED | CANCELLED)`. *Seats filled = count of CONFIRMED/ACTIVE enrollments — computed, never stored.*

### Enrollment & money
- **EnrollmentLink** — `token (unique, 32+ random bytes)`, `leadId`, `batchId`, `pricePaise` (server-bound offer incl. approved discount), `status (SENT | OPENED | COMPLETED | EXPIRED | REVOKED)`, `expiresAt`, `sentById → StaffUser`, `enrollmentId?` (set on completion). The funnel's step 6–8 instrument.
- **Enrollment** — `studentId`, `batchId`, `status (PAYMENT_PENDING | CONFIRMED | ONBOARDING | ACTIVE | COMPLETED | WITHDRAWN | DEFERRED)`, `pricePaise` (locked at enrollment — catalog price may change later), `discountPaise`, `sourceLeadId?`, `enrollmentLinkId?`. Unique `(studentId, batchId)`.
- **PaymentSchedule** — installment plan rows: `enrollmentId`, `seq`, `dueDate`, `amountPaise`, `status (PENDING | PAID | OVERDUE | WAIVED)`.
- **PaymentTransaction** — **immutable ledger**: `enrollmentId`, `scheduleId?`, `provider (RAZORPAY | BANK | CASH)`, `providerOrderId`, `providerPaymentId (unique — idempotency key)`, `amountPaise`, `status (CREATED | AUTHORIZED | CAPTURED | FAILED | REFUNDED)`, `method`, `rawPayload Json`. Rows are never updated to a "less final" state, never deleted.
- **Invoice** — carried from Phase 1: `invoiceNo (unique, MS/FY/seq)`, `fiscalYear`, `enrollmentId?`, `studentId?`, buyer snapshot fields (name/address/GSTIN/state — snapshotted, not joined, so old invoices never change), `subtotalPaise`, `gstRatePct`, `cgst/sgst/igstPaise`, `totalPaise`, `status (DRAFT | ISSUED | PAID | CANCELLED)`, `pdfKey (R2)`.
- **InvoiceItem** — `invoiceId`, `description`, `hsnSac`, `qty`, `unitPricePaise`, `amountPaise`.
- **InvoiceCounter** — `fiscalYear (unique)`, `lastSeq`. Incremented inside a serializable transaction (Phase 1's atomic-numbering function, ported to Prisma `$transaction`).

### Support tables
- **CommunicationLog** — `channel (EMAIL | WHATSAPP)`, `to`, `templateKey`, `entityRef`, `providerMessageId`, `status (QUEUED | SENT | DELIVERED | FAILED)`.
- **Document** — `ownerType/ownerId`, `kind (ID_PROOF | CERTIFICATE | INVOICE_PDF | EXPORT)`, `r2Key`, `mime`, `sizeBytes`, `uploadedById`.
- **AuditLog** — `actorId`, `action`, `entityType/entityId`, `before Json`, `after Json`. Written by the service layer on every mutation of money-adjacent entities.
- **WebhookEvent** — `provider`, `eventId (unique)`, `type`, `payload Json`, `processedAt?`. Dedupe + replay for webhook processing.

**Relationship summary:** Lead →(converts)→ Student →(enrolls)→ Enrollment ←→ Batch ← Course; Enrollment → PaymentSchedule → PaymentTransaction → Invoice → InvoiceItems. Activities and Documents hang off everything polymorphically.

**Indexing strategy:** btree on every FK; `Lead(status, assignedToId)`, `Lead(phone)`, `Enrollment(batchId, status)`, `PaymentTransaction(providerPaymentId)`, `Invoice(fiscalYear, invoiceNo)`, `Activity(leadId, createdAt desc)`.

---

## 5. API Design & Flows

### Conventions
- **Reads** for pages: React Server Components call module `queries.ts` directly (no HTTP hop, no API route needed).
- **Writes**: Route Handlers under `/api/*` (or Server Actions for simple forms) → every handler wrapped by `lib/api.ts` which does: Clerk auth → role check → Zod parse → service call → typed error envelope `{ ok, data | error: { code, message } }`.
- Pagination: cursor-based (`?cursor=&limit=`). Mutations that money depends on are idempotent (client sends `Idempotency-Key`, stored server-side).

### Flow 1 — Lead capture (public)
```
Website form → POST /api/leads (rate-limited, honeypot + optional Turnstile)
  → leads.service.captureLead(): upsert on phone, merge extra json
  → Activity("SYSTEM: captured from WEBSITE")
  → comms.enqueue(welcome email)   [async, non-blocking]
← 201 (form UX never waits on email)
```

### Flow 2 — Enrollment Link → Form → Payment (funnel steps 6–12, the money path)
```
1. QUALIFIED lead → counselor picks batch (+discount if approved)
   → POST /api/enrollment-links { leadId, batchId, discountPaise? }
   → EnrollmentLink(SENT, token, price server-bound, expires 7d)
   → comms: email + WhatsApp share link; Lead → LINK_SENT
2. Student opens /enroll/[token]  (public page, no login)
   → GET validates token (unexpired, unused) → EnrollmentLink(OPENED)
   → form pre-filled from Lead; collects address/state (GST), qualification
3. POST /api/enroll/[token] (rate-limited, idempotent on token)
   → tx: Student upsert (by phone), Enrollment(PAYMENT_PENDING),
     PaymentSchedule rows if installments, EnrollmentLink → COMPLETED
   → razorpay.orders.create(amount from LINK, never from client)
   ← { razorpayOrderId, keyId } → Razorpay Checkout opens on same page
4. Client POST /api/payments/verify (signature check) → optimistic "thank you" only
5. WEBHOOK /api/webhooks/razorpay  ←― SOURCE OF TRUTH
   → verify X-Razorpay-Signature (raw body, timing-safe)
   → WebhookEvent upsert on eventId (dedupe; replay-safe)
   → tx: PaymentTransaction → CAPTURED, PaymentSchedule → PAID,
         Enrollment → CONFIRMED, Lead → CONVERTED
   → enqueue (funnel steps 9–12, all async):
       a. invoice.generate (MS/FY/seq, GST math) → pdf.render → r2.put
       b. resend.send(invoice + receipt)                    [Invoice Sent]
       c. onboarding.start → welcome email, checklist,
          Enrollment → ONBOARDING                           [Onboarding]
       d. access.grant → portal invite / WhatsApp group / LMS link,
          Enrollment → ACTIVE                               [Course Access]
   ← 200 fast (< 1s; heavy work is queued)
```

### Flow 3 — Invoice PDF
```
invoice.service.create() [same GST math as Phase 1, in lib/money.ts]
  → numbering: $transaction { counter row FOR UPDATE → seq++ → MS/25-26/NN }
  → render HTML template → Puppeteer function → PDF buffer
  → R2 put (private) → Document row → CommunicationLog + Resend email
Download: GET /api/invoices/:id/pdf → authz (staff, or the student who owns it)
  → 302 to 5-minute presigned R2 URL
```

### Flow 4 — Document upload
```
POST /api/uploads/presign { kind, filename, mime, size }
  → authz + validate (mime allowlist, ≤10MB)
  → presigned PUT URL (5 min) + Document(PENDING)
Client PUTs directly to R2 → POST /api/uploads/confirm → Document(ACTIVE)
```

---

## 6. Authentication & Authorization (Clerk)

**Two user populations, one Clerk instance:**

| Population | Sign-in | Access |
|---|---|---|
| Staff (admins, counselors, accounts) | Email + password + MFA enforced; invite-only (no public staff signup) | `(crm)/admin/**` |
| Students | Email/phone OTP, Google | `(student)/portal/**` only their own data |

**Mechanics:**
- `middleware.ts` (Clerk middleware): public routes allowlisted; everything under `/admin` and `/portal` requires a session; `/admin` additionally requires staff role claim.
- **Role authority lives in the local `StaffUser` table**, mirrored into Clerk `publicMetadata.role` for fast middleware checks. Middleware check = coarse gate (UX); **service-layer `requireRole()` = the real enforcement** on every mutation. Never trust the middleware alone.
- Clerk webhook (`user.created`, `user.updated`, `user.deleted`) syncs users into `StaffUser`/`Student` rows (Svix signature verified).
- Roles: `ADMIN` (everything), `ACCOUNTS` (payments/invoices/refund initiation), `COUNSELOR` (leads/students/enrollments; sees own pipeline + shared views; cannot cancel invoices), `VIEWER` (read-only dashboards).
- Students: authorization is **ownership-scoped** — every portal query filters by `student.clerkUserId = auth().userId`. No student-facing endpoint accepts a bare `studentId` from the client.

---

## 7. Security

**Data protection**
- All money computed server-side in integer paise; client-submitted amounts are never trusted (order amount re-derived from DB at order creation and re-checked at webhook).
- Invoice buyer details are snapshots — immutable financial records; invoices are cancelled (status), never deleted.
- PII (phone, address, ID documents): private R2 bucket, presigned URLs ≤ 5 min, mime/size allowlists; DB access only through Prisma (parameterized — SQLi-safe by construction).
- Secrets in Vercel env vars per-environment; `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`, R2 keys, `CLERK_SECRET_KEY` never shipped to client (only `NEXT_PUBLIC_` exceptions: Clerk publishable key, Razorpay key id).

**Perimeter**
- Webhooks: raw-body signature verification (Razorpay HMAC, Clerk/Svix), timestamp tolerance, `WebhookEvent.eventId` dedupe.
- Public endpoints (lead capture): per-IP rate limiting (Upstash Ratelimit at middleware), honeypot field, optional Cloudflare Turnstile after abuse observed.
- Security headers via `next.config`/middleware: CSP (script-src self + Clerk + Razorpay checkout), HSTS, X-Frame-Options DENY (except Razorpay frame ancestors where required), Referrer-Policy.
- CSRF: mutations require JSON content-type + same-origin check; Server Actions get Next.js built-in origin protection.

**Accountability**
- `AuditLog` on every mutation of Lead status, Enrollment, Payment, Invoice — who, what, before/after.
- Immutable ledgers (`PaymentTransaction`, `Activity`) — corrections are compensating entries, not edits.
- Role changes and refunds require `ADMIN`; refunds also write a mandatory reason to the audit log.

**Compliance posture (India)**
- GST-correct invoicing (CGST/SGST vs IGST by buyer state — logic already proven in Phase 1).
- DPDP Act hygiene: data-minimal lead forms, delete-student workflow (anonymize PII, retain financial records as required for 8 years).

---

## 8. Deployment (Vercel)

| Environment | Branch | Database | Purpose |
|---|---|---|---|
| Production | `main` | Neon/Supabase Postgres (prod) | Live |
| Preview | PR branches | Neon branch DB per preview | Review with real, isolated data |
| Development | local | Local Postgres or Neon dev branch | Dev |

- **Database:** Neon (or Supabase) Postgres via Vercel Marketplace; Prisma with connection pooling (Neon pooled connection string / PgBouncer) — mandatory for serverless.
- **Migrations:** `prisma migrate deploy` runs in the Vercel build step; migrations are forward-only, reviewed in PR. Never `db push` against prod.
- **Config:** `vercel.ts` — cron definitions, function memory overrides (PDF function: 1536MB+, `maxDuration` raised), headers.
- **Functions:** Fluid Compute (default), Node runtime everywhere (Prisma, Puppeteer, Razorpay SDK all need Node). No Edge runtime for data routes.
- **Crons (Vercel Cron):** daily payment-reminder sweep (overdue `PaymentSchedule` → reminder email/WhatsApp link), nightly `OVERDUE` status marker, weekly pipeline digest to admin.
- **Webhooks config:** Razorpay dashboard → prod URL only; test-mode keys on previews.
- **Observability:** Vercel logs + Sentry (API + client), structured `console.error` with request ids; alerts on webhook failures (a missed Razorpay webhook = money invisible — this is the #1 alert).
- **DNS:** `medskillscatalyst.com` stays on the marketing pages within the same app; `/admin`, `/portal` are route groups — one domain, no CORS anywhere.

---

## 9. Scalability Path

**Phase now (0–1k students):** everything above, single Postgres, no caching layer. This comfortably handles this scale — do not add infrastructure prematurely.

**Growth levers, in the order you'll actually need them:**
1. **DB reads** — add indexes from slow-query logs; move dashboard aggregates to materialized views refreshed by cron.
2. **Queues** — webhook fan-out (invoice, email, PDF) already async; scale worker concurrency, not the app.
3. **Caching** — Next.js data cache for public course pages, tag-based revalidation on catalog edits (`revalidateTag('courses')`).
4. **PDF service** — if Puppeteer-on-Vercel becomes flaky at volume, lift `services/pdf/` to a tiny always-on worker (Railway/Fly) — the interface (`pdf.render(html) → buffer`) doesn't change, callers unaffected. This is the first thing to extract, by design.
5. **Read replicas** (Neon) for reporting at ~10k+ students.
6. **Module extraction** — because modules only communicate through service interfaces, any slice (e.g., comms) can become a separate service with an HTTP/queue boundary swapped in behind the same function signatures.

**Multi-tenant note:** if Medskills ever white-labels to other institutes, add `orgId` to every table + Clerk Organizations. Designed-for, not built now.

---

## 10. What is deliberately NOT in v1

- No separate backend service, no microservices, no GraphQL, no Redis (except rate-limit KV), no event bus, no data warehouse, no mobile app. Every one of these has a designed insertion point (§9) but zero of them are needed to serve the first thousand students.

---

## 11. Migration from the current system

> **DECIDED 2026-07-22: Option A** — Supabase Postgres remains the database; Prisma points at it.
> **UPDATED 2026-07-22:** the old Phase 1 invoice schema has been **deleted from Supabase** by the owner. Consequence: no introspection/baseline needed — **Prisma owns the schema from scratch via migrations**, designed directly from §4 and the funnel (§1.5). This is the cleanest possible version of Option A: same database project, brand-new Prisma-managed schema.

What carries over anyway (as code, not data):
- Invoice **logic** from Phase 1 — `MS/FY/seq` numbering algorithm, GST math (CGST/SGST vs IGST), amount-in-words, the pixel-perfect HTML template — all port 1:1 into the new invoice module.
- Any still-existing tables the live site writes to (e.g. `leads`, careers) are verified at execution time and either adopted into the Prisma schema or replaced with a one-time copy into the new `leads` shape.

Sequencing:
1. Prisma migrations create the full funnel schema in Supabase; Clerk replaces passcode auth; new `/admin` CRM ships (biggest security win, do first).
2. Funnel core: enrollment links → student form → Razorpay → auto-invoice (steps 6–10).
3. Onboarding + course access automation (steps 11–12).
4. Retire `admin.html`/`invoice.html` once parity confirmed; static marketing pages stay as-is (they're fine).

---

## Appendix A — Environment variables

```
DATABASE_URL / DIRECT_URL          # pooled + direct (migrations)
CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_WEBHOOK_SECRET
RAZORPAY_KEY_ID (public) / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY / EMAIL_FROM
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET
UPSTASH_REDIS_REST_URL / _TOKEN    # rate limiting
SENTRY_DSN
```

## Appendix B — Suggested build order (each phase shippable)

1. **Foundation** — Next.js + Clerk + Prisma pointed at existing DB; staff roles; new `/admin` shell.
2. **CRM core** — leads list/detail/timeline/assignment (parity with today, plus activities).
3. **Invoicing port** — Phase 1 invoicing inside the new app; Puppeteer PDF + R2 + Resend email.
4. **Catalog + Enrollments** — courses, batches, convert-lead flow.
5. **Payments** — Razorpay orders + webhook + auto-invoice + receipts.
6. **Automation** — reminders (cron), comms log, dashboard reports.
7. **Student portal** — last, once there's data worth showing students.
