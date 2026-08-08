# MedSkills Catalyst — Technical Overview & Security Review Brief

**Prepared by:** Harit Khan
**For:** External technical / security reviewer
**Date:** 7 August 2026
**Scope:** Public website, enrollment and payment flow, internal CRM/admin, and the services behind them.

> I've written this up so that before you start the review you already have a clear picture of what we run and how it fits together, instead of having to reverse-engineer it from the code. I've tried to be straight about the parts I'm not fully sure of. Where I already know something is a shortcut or a soft spot, I've said so rather than hide it — those are called out in section 9. If you're short on time, section 4 (payments) and section 9 (what to look at) are the two that matter most.

---

## 1. The short version

The site isn't one big application. It's really two things sharing a domain:

1. **A static marketing website** built in plain **HTML, CSS and JavaScript** — the landing pages, the policy pages, the brochures. There's no server logic behind these, so there isn't much of an attack surface on them.
2. **A dynamic application** built on **Next.js 15, React 19 and TypeScript**. This is the part that needs a server and a database: online **enrollment and payment**, our internal **CRM/admin**, the **careers** section, and **webinar** registration.

Hosting is **Vercel** (serverless). The database is **PostgreSQL**, running on **Supabase**. Payments go through **Razorpay**, and transactional email through **Resend**.

If you only look at two things, make them section 4 (the payment flow) and section 9 (the areas I'd like you to dig into).

---

## 2. Technology stack

Everything below is taken straight from the codebase, not from memory.

| Layer | Technology | Notes |
|---|---|---|
| **Static site** | HTML5, CSS, vanilla JS | ~14 pages at the repo root, mirrored into `public/`. Served as plain static files. |
| **App framework** | Next.js `15.3` (App Router) | React Server Components, Server Actions and API routes. |
| **UI library** | React `19` | |
| **Language** | TypeScript `5.7` | Used across all of the app code. |
| **Styling** | Tailwind CSS `3.4`, `motion` `12` | Utility CSS plus animation. |
| **Forms & validation** | `react-hook-form` `7`, **Zod** `4` | Every user input is validated against a Zod schema. |
| **ORM / DB access** | **Prisma** `7` with `@prisma/adapter-pg` | Type-safe, parameterised queries. We don't build SQL by string concatenation anywhere in the app paths. |
| **Database** | **PostgreSQL** (Supabase) | Reached through the Supabase transaction pooler. |
| **File storage** | **Supabase Storage** | Enrollment document uploads (ID proof and similar). |
| **Payments** | **Razorpay** Standard Checkout | Server-side orders, signature verification, and a webhook. |
| **Email** | **Resend** (HTTP API) | Enrollment confirmations and invoices. |
| **Analytics / marketing** | PostHog, Google Analytics 4, Meta Pixel + Meta Conversions API | The Meta Conversions API call runs server-side. |
| **Hosting / runtime** | **Vercel** serverless (Node.js) | |
| **Auth (installed vs used)** | `@clerk/nextjs` is in the dependencies but **isn't actually wired in yet**. The admin gate we use today is a shared passcode that sets an HMAC cookie — see section 5. | I've flagged this on purpose; more in section 9. |

Dependencies are pinned in `package.json` / `package-lock.json`. There are no custom native/C modules.

---

## 3. How the repository is laid out

```
/ (repo root)
├── *.html                      Static marketing site (index, about, policies, brochures…)
├── public/                     The static pages Vercel actually serves
├── assets/                     Shared static JS/CSS/images (incl. meta-pixel.js)
│
├── src/
│   ├── app/                    Next.js App Router
│   │   ├── foundation/         Foundation course landing + enroll
│   │   ├── advanced/           Advanced module landing + enroll
│   │   ├── enroll/[token]/     Token-based (personalised) enrollment + payment
│   │   ├── webinar/            Webinar registration + calendar.ics
│   │   ├── careers/            Public job listings + application form
│   │   ├── admin/              Internal CRM (leads, careers) — passcode-gated
│   │   └── api/                Server endpoints (see sections 4 and 6)
│   │       ├── enroll/upload/          Document upload → Supabase Storage
│   │       ├── webhooks/razorpay/       Payment webhook (the authoritative one)
│   │       ├── invoices/                GST invoice generation
│   │       ├── careers/                 Job application + admin
│   │       ├── qa-register/ register/   Webinar / lead capture
│   │       └── admin/leads/export/      CSV/XLSX lead export (gated)
│   │
│   ├── lib/                    Shared server helpers
│   │   ├── auth.ts             Passcode session + role check
│   │   ├── db.ts               Prisma client (singleton)
│   │   ├── razorpay.ts         Order creation + signature verification
│   │   ├── invoices.ts         GST invoice builder
│   │   ├── email.ts            Resend wrapper
│   │   ├── supabase.ts         Storage admin client
│   │   └── meta-capi.ts        Server-side Meta Conversions API
│   │
│   ├── modules/               Domain logic (enroll, leads) — schemas + services
│   └── generated/prisma/      Prisma client (generated, git-ignored)
│
├── prisma/schema.prisma       Database schema — the source of truth for the tables
├── supabase/*.sql             Raw SQL schema snapshots / migrations
├── docs/CRM_ARCHITECTURE.md   CRM design doc
├── next.config.ts             URL rewrites (static pages → clean URLs)
├── vercel.json                Hosting config / headers
└── .env.example               Lists every env var (values left blank — see section 7)
```

The way the two halves sit together: `next.config.ts` rewrites the clean URLs (`/`, `/refund-policy`, and so on) to the static HTML files, and everything under `src/app/**` is the actual application. That split is deliberate. The marketing pages have no server logic, so there's nothing on them for anyone to exploit server-side.

---

## 4. The payment flow (Razorpay)

This is the part I'd most want a second opinion on. The rule I stuck to throughout is simple: never trust the browser when money is involved.

**Creating the order.** When someone enrolls, the amount is worked out **on the server, from the database** (`EnrollmentLink.price_paise` / the course price). It's never read back from the browser. The server then calls Razorpay's Orders API with that figure. The relevant code is `createRazorpayOrder()` in `src/lib/razorpay.ts`, called from `src/modules/enroll/service.ts`, and the amount is validated (a whole number, at least 100 paise) before the call goes out.

**Checkout itself** runs Razorpay's hosted `checkout.js` in the browser. The only Razorpay key the browser ever sees is the publishable key id (`NEXT_PUBLIC_RAZORPAY_KEY_ID`). The secret key stays on the server — `src/lib/razorpay.ts` is marked `import "server-only"` so it can't accidentally end up in a client bundle.

There are two separate checks that a payment is genuine:

1. **The checkout callback signature.** After checkout we recompute `HMAC_SHA256(order_id | payment_id, KEY_SECRET)` and compare it to the `razorpay_signature` we were sent, using a constant-time comparison (`crypto.timingSafeEqual`).
2. **The webhook, which we treat as the real source of truth** for whether money actually moved. `POST /api/webhooks/razorpay` does the following:
   - reads the raw request body (we don't let the framework parse it first) and verifies the `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET`;
   - de-duplicates on the `x-razorpay-event-id` header, backed by a unique constraint on the `WebhookEvent` table, so a repeated delivery can't be processed twice;
   - on `payment.captured` / `order.paid`, runs fulfillment that's safe to repeat (record the capture, generate the invoice, send the email);
   - if any of those steps didn't finish, returns a non-200 so Razorpay retries, and only marks the event processed once everything is actually done.

The upshot: a forged or wrong-signature webhook is rejected with a `400` before anything touches the database, duplicate deliveries do nothing, and fulfillment can safely be retried. The idempotency and retry logic is the bit I'd most like you to try to break.

**On the keys:** we can run on Razorpay test keys and switch to live keys purely through environment variables, no code change. Confirming that the live configuration is set up correctly is one of the things I'd like verified.

---

## 5. Authentication and access control

There are two trust zones, and they're treated very differently.

The **public** side — the marketing pages, course landing pages, enrollment forms, webinar and careers forms — has no login. It's protected by input validation and by gating individual actions (for example, a document upload only works against a valid, live enrollment token).

The **internal** side — everything under `src/app/admin/**`, plus the sensitive API routes (lead export, invoices, careers admin) — is gated.

Here's how that gate works today, and I want to be plain about it. The internal area is protected by a **single shared passcode** (`ADMIN_PASSCODE`, an environment variable). When it's entered correctly we set an `httpOnly` cookie whose value is `HMAC_SHA256("msc-admin-v1", passcode)`, so the cookie can't be forged without knowing the secret. Both the passcode check and the cookie check are constant-time (`timingSafeEqual`). The enforcement happens in each protected page or route by calling `requireStaff()` / `getStaff()` in `src/lib/auth.ts`. There's a role hierarchy in the schema (ADMIN > ACCOUNTS > COUNSELOR > VIEWER), but in practice every passcode session maps to one ADMIN staff record. Two of the older endpoints (`/api/careers/admin` and `/api/invoices`) read the passcode from an `x-admin-passcode` header directly rather than from the cookie session.

I know a shared passcode is a blunt instrument for something holding customer data, and it's the main thing I want your read on (section 9). `@clerk/nextjs` is already a dependency because the plan is to move to proper per-user accounts, but that migration hasn't happened yet.

One more thing worth knowing: there's no `middleware.ts`, so access control isn't enforced by a single global gate. It's done route by route. That means it's worth checking that no protected route is quietly missing its check.

---

## 6. Data and storage

- **Database:** PostgreSQL on Supabase. The schema lives in `prisma/schema.prisma` (leads, staff users, courses, batches, enrollment links, enrollments, payments, invoices, webhook events, activities, careers applications). There are raw SQL snapshots under `supabase/*.sql` as well.
- **DB access:** Prisma through the `pg` adapter, over the Supabase transaction pooler. Queries are parameterised by the ORM.
- **File uploads:** enrollment documents go into a Supabase Storage bucket through a server-only admin client (`src/lib/supabase.ts`). The upload endpoint (`/api/enroll/upload`) only accepts a write against a live enrollment link, and it checks the file type against an allow-list of MIME types and extensions, so the bucket can't be used as open storage.
- **Personal data we hold:** names, emails, phone numbers, uploaded ID documents, and payment/invoice records. That's the data I'd most want threat-modelled.

---

## 7. Secrets and configuration

- Every secret is an environment variable set on Vercel. None are committed. `.gitignore` excludes `.env`, `.env.local` and `.env*`; the only env file in git is `.env.example`, which lists the variable *names* with blank placeholders and some inline notes. I checked, and there's no real `.env` tracked in the repo.
- Anything meant for the browser is namespaced `NEXT_PUBLIC_*` (the pixel id, the GA id, the Razorpay publishable key). Those are public identifiers by design, not secrets.
- The genuine secrets are `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `META_CAPI_ACCESS_TOKEN`, `ADMIN_PASSCODE` and `DATABASE_URL`. The files that touch them are marked `import "server-only"` so they can't be pulled into client code.

`.env.example` is a good checklist to start from — it's the full, current list of variables.

---

## 8. Outside services we depend on

| Service | What it's for | Secret we hold |
|---|---|---|
| **Vercel** | Hosting, serverless functions, env management | Platform account |
| **Supabase** | PostgreSQL + object storage | `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| **Razorpay** | Payment processing | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Resend** | Transactional email | `RESEND_API_KEY` |
| **Meta (Facebook)** | Pixel + Conversions API (marketing) | `META_CAPI_ACCESS_TOKEN` |
| **Google Analytics / PostHog** | Web analytics | Public measurement IDs |

---

## 9. Where I'd most like you to dig in

I'd rather point you straight at the soft spots than have you find them, so here's my honest list:

1. **The admin login.** The shared passcode plus HMAC cookie from section 5. Is it good enough for an internal tool holding customer data, or should we finish moving to real per-user accounts (Clerk is already installed)? Anything around session fixation, cookie scope or logout that concerns you?
2. **Payment integrity.** The whole Razorpay flow in section 4 — the boundary where the amount is decided, the signature checks, and above all the webhook's de-duplication and retry logic. Is there any way a payment could be fulfilled twice, or fulfilled without an actual capture?
3. **Route-level access control.** Because there's no global middleware, is there a protected page or API route somewhere that's missing its check? The lead export and the invoice endpoints are the ones I'd worry about first.
4. **The upload endpoint.** `/api/enroll/upload` — the MIME/extension allow-list, size limits, the token gating, and whether the storage bucket is set to be properly private.
5. **Where personal data could leak.** Anywhere ID documents, emails or phone numbers might escape — bucket permissions, the export endpoints, or error messages and logs.
6. **Dependencies and config.** Anything in `package-lock.json`, `next.config.ts`, `vercel.json`, or the security headers (CSP, HSTS and so on) that you'd tighten.

---

## 10. Getting oriented quickly

- **To run it locally:** `npm install`, set the env vars from `.env.example`, then `npm run dev`.
- **Best files to start with:** `src/lib/razorpay.ts`, `src/app/api/webhooks/razorpay/route.ts`, `src/lib/auth.ts`, `src/app/api/enroll/upload/route.ts`, and `prisma/schema.prisma`.
- **Design notes:** `docs/CRM_ARCHITECTURE.md`.

Happy to walk you through any of it on a call, and I can give you read access to the repo and to the Vercel and Supabase dashboards whenever you need it. Thanks for taking a look.

— Harit Khan
