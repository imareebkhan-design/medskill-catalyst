# CRM Platform — Phase 1 Implementation Plan (Foundation) — v2

> **Decisions locked:**
> 1. Option A — Supabase Postgres stays THE database; Prisma points at it.
> 2. **DB state verified 2026-07-22 (service_role probe):** project `bvsjrlbnihwhiguchcnf` contains production data — `leads` (61 rows), `invoices`/`invoice_items`/`invoice_counters` (1 each, MS/25-26 numbering live), `career_applications` (3). Only `careers` and `qa_leads` tables are absent. → Original Option A flow applies: **introspect + baseline existing tables, then additive migrations** for the funnel schema. Existing data is never dropped.
> 3. The funnel in `docs/CRM_ARCHITECTURE.md` §1.5 is the source of truth for every status enum.
> **Repo reality:** already Next.js 15 + React 19 App Router — extend, don't scaffold.

## Scope of Phase 1 (funnel steps 2–5: capture → dashboard → discovery call → qualified)

1. Prisma connected to Supabase; first migration creates the funnel-core schema.
2. Clerk authentication replacing the passcode gate; `staff_users` with roles.
3. New `/admin` CRM: pipeline dashboard + leads table + lead detail with activity timeline and status transitions (`NEW → CONTACTED → DISCOVERY_CALL → QUALIFIED → LINK_SENT → CONVERTED | LOST`).
4. Lead capture upgraded: `POST /api/leads` writes to the new schema with `source` + `attribution Json` (utm_*, gclid, fbclid, landing page, referrer) — website forms keep working.

**Non-goals (Phase 2+):** enrollment links, Razorpay, invoices, R2, onboarding automation, student portal. (Schema for them IS created now — building the tables once avoids churn — but no UI/API against them yet except leads.)

## Prerequisites — needed from Areeb before execution

| # | Item | Where |
|---|---|---|
| 1 | Supabase **pooled** connection string (Transaction mode, port 6543, `?pgbouncer=true&connection_limit=1`) → `DATABASE_URL` in `.env.local` | Supabase → Settings → Database |
| 2 | Supabase **direct** connection string (port 5432) → `DIRECT_URL` in `.env.local` | Same page |
| 3 | Clerk application → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` in `.env.local` | dashboard.clerk.com |
| 4 | Confirm what still exists in the DB: does the old `leads` table (live website forms write to it) survive the schema deletion? Careers/QA tables? | Supabase → Table editor (or I check once creds are in `.env.local`) |

## Steps

### Step 1 — Prisma: introspect existing + additive funnel schema
- `[NEW]` `prisma/schema.prisma` — start from `prisma db pull` (adopts existing `leads`, `invoices`, `invoice_items`, `invoice_counters`, `career_applications` exactly as they are), then extend with §4 entities: StaffUser, Student, Activity, Course, Batch, EnrollmentLink, Enrollment, PaymentSchedule, PaymentTransaction, CommunicationLog, Document, AuditLog, WebhookEvent. Money = integer paise, enums per funnel.
- Baseline so the existing tables are never re-created: `prisma migrate diff --from-empty --to-schema-datasource` → `0_init` → `prisma migrate resolve --applied 0_init`; then one **additive** migration for the new tables + new `leads` columns (`status`, `source` enum mapping, `attribution jsonb`, `assigned_to`) with defaults that leave the 61 existing rows valid.
- `[NEW]` `src/lib/db.ts` — Prisma singleton (pooled runtime URL, `directUrl` for migrations).
- `[MODIFY]` `package.json` — `prisma`, `@prisma/client`; scripts `db:migrate`, `db:studio`.
- `[MODIFY]` `.env.example` — `DATABASE_URL`, `DIRECT_URL`, Clerk keys.
- RLS enabled + service-role-only policies on all new tables (same pattern as existing).
- Guardrail: **no DROP of any kind in Phase 1 migrations**; invoice numbering counter untouched (adopted as-is).

### Step 2 — Clerk integration
- `[MODIFY]` `package.json` — `@clerk/nextjs`.
- `[NEW]` `src/middleware.ts` — `clerkMiddleware`; protect `/admin(.*)`, `/api/admin(.*)`; all else public. (Verify current Clerk API from docs at execution time.)
- `[MODIFY]` `src/app/layout.tsx` — `<ClerkProvider>`.
- `[NEW]` `src/app/sign-in/[[...sign-in]]/page.tsx`; public signup disabled in Clerk dashboard (invite-only staff).
- `[NEW]` `src/app/api/webhooks/clerk/route.ts` — Svix-verified user sync → `staff_users`.
- `[NEW]` `src/lib/auth.ts` — `requireStaff(role?)`.
- Seed first ADMIN (Areeb) via seed script.

### Step 3 — /admin CRM shell (funnel steps 2–5)
- `[NEW]` `src/app/admin/layout.tsx` — authed shell: Pipeline, Leads, Settings.
- `[NEW]` `src/app/admin/page.tsx` — funnel dashboard: counts per stage, per source (Organic/Google/Meta), stage conversion %.
- `[NEW]` `src/app/admin/leads/page.tsx` — table: search, stage filter, source filter, assigned-to, pagination.
- `[NEW]` `src/app/admin/leads/[id]/page.tsx` — lead detail: activity timeline, log call/note, status transitions with guardrails (QUALIFIED requires course interest; LOST requires reason).
- `[NEW]` `src/modules/leads/{service.ts,schemas.ts,queries.ts}` — capture (upsert-merge on phone, attribution), transition, assign, timeline. Every transition writes `Activity`.
- `[MODIFY]` lead-capture endpoints (`src/pages/api/leads.ts` semantics → `src/app/api/leads/route.ts`): same request contract as today's website forms + new attribution fields; Pages Router file deleted after port.
- End-of-phase `[DELETE]` (after manual parity check): `public/admin.html`, `src/pages/admin.tsx`, `src/pages/api/leads.ts`; `[MODIFY]` `next.config.ts` (drop stale rewrites).

### Step 4 — Verification
- `npm run type-check` && `npm run build`; `prisma migrate status` clean.
- Smoke: Clerk sign-in → /admin → create lead → walk it NEW→QUALIFIED → timeline correct; website form POST still lands a lead with attribution; non-staff user blocked.

## Risks
- **Live forms during cutover:** website `POST /api/leads` must never 500 — new route deployed backward-compatible before old one is removed (same deploy, contract-identical).
- **Pooler + Prisma:** transaction-mode pooler with `pgbouncer=true` or prepared-statement errors; direct URL only for migrate.
- **Clerk API drift:** confirm from current docs before writing middleware.
- **Unknown DB remnants:** prereq #4 resolves; nothing destructive is ever run against remaining tables without explicit confirmation.
