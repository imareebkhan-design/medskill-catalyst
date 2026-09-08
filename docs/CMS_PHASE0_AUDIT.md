# MedSkills Catalyst CMS — Phase 0 Repository Audit

Status: **audit complete, implementation not started** (awaiting architecture sign-off)
Date: 7 September 2026

---

## A. Current architecture

| Concern | Finding |
|---|---|
| Framework | Next.js `^15.3.0`, React 19 |
| Router | **App Router** (`src/app/**`) with a small legacy **Pages Router** island (`src/pages/api/leads.ts`, `src/pages/api/register.ts`, `src/pages/_app.tsx`) |
| Language | TypeScript 5.7, `strict: true`, path alias `@/* → ./*` |
| Styling | Tailwind 3.4 + a bespoke brand token layer in `tailwind.config.ts` (brand.navy/blue/cyan, `rounded-msc*`, `shadow-msc*`, Fraunces + Plus Jakarta fonts) |
| Component library | No third-party kit. Hand-rolled primitives in `src/components/ui/` (button, card, input, label, select, textarea, checkbox, accordion) |
| Database | **PostgreSQL on Supabase**, accessed through **Prisma 7** (`@prisma/adapter-pg`, driver adapter). Client generated to `src/generated/prisma` (gitignored, regenerated at build) |
| Migrations | `prisma/migrations/` — 3 applied (`0_init`, `funnel_core`, `razorpay_fulfillment`) |
| Auth | **Shared-passcode session.** `src/lib/auth.ts`: `ADMIN_PASSCODE` env → HMAC-SHA256 httpOnly cookie `msc_admin`, 12h. All sessions collapse to one synthetic `StaffUser` row (`clerk_user_id: "passcode-admin"`, role ADMIN) |
| File storage | **Supabase Storage**, private bucket `enrollment-docs`, service-role client in `src/lib/supabase.ts` (`server-only`), upload route `src/app/api/enroll/upload/route.ts` |
| Forms | `react-hook-form` ^7.82 + `@hookform/resolvers` ^5.4 + `zod` ^4.4 — **already installed and in use** |
| Hosting | Dual-target. `apphosting.yaml` + `firebase.json` (Firebase App Hosting, backend `medskills-catalyst`) and `vercel.json`. Currently live on Vercel; Firebase deployed but paused pre-DNS-cutover |
| Analytics | GA4 + PostHog + Meta Pixel + Meta CAPI (`src/lib/meta-capi.ts`) |
| Payments | Razorpay Standard Checkout, webhook at `src/app/api/webhooks/razorpay/route.ts` |
| Caching | **None configured.** Every admin page is `export const dynamic = "force-dynamic"`. Public marketing pages are static files. No `revalidateTag`/`revalidatePath` anywhere |

### The decisive finding

**The public marketing homepage is not React.** It is a single **296 KB static HTML file** — `public/index.html`, mirrored at repo-root `index.html` — served through a Next.js rewrite:

```ts
// next.config.ts
{ source: "/", destination: "/index.html" }
```

All CMS-target content (cohort dates, success stories, faculty) is **hand-written HTML inside that file**, alongside ~3,200 lines of inline CSS and ~1,500 lines of inline JS (marquee autoscroll, testimonial expand/collapse, FAQ accordion, mobile nav).

This single fact governs the entire integration design. It is addressed in §E.

---

## B. Content audit — exactly where each field lives today

### 1. Cohort information — **11 hardcoded copies, no single source**

| # | Location | Line | Current value |
|---|---|---|---|
| 1 | `index.html` hero stat | 3297 | `26 September 2026` / label "Cohort Starts" |
| 2 | `index.html` bento badge | 3954 | `COHORT · ADMISSIONS OPEN` |
| 3 | `index.html` bento fact | 3969 | Start Date → `26 September 2026` |
| 4 | `index.html` footer strip | 4233 | `Next Cohort · 26 Sep 2026` |
| 5 | `index.html` popup | 4321 | `Next Cohort · Sep 26, 2026` |
| 6 | `index.html` welcome card | 4659 | `Admissions Open · Sep 26` |
| 7 | `index.html` FAQ answer (JS array) | 4848 | "…begins on 26 September 2026…" |
| 8 | `index.html` mobile sticky CTA | 6225 | `Batch · Sep 26, 2026` |
| 9 | `src/app/foundation/page.tsx` metadata | 13 | "Next cohort starting 26 September 2026." |
| 10 | `src/app/foundation/landing-client.tsx` banner | 117 | "Orientation starting 26 September 2026." |
| 11 | `src/app/foundation/landing-client.tsx` FAQ | 595 | "The next cohort begins on 26 September 2026." |

Eleven copies across two rendering systems, in **six different display formats** — confirming the PRD's "store the date, not the string" requirement.

Note: a `Batch` model already exists in Prisma (`start_date`, `end_date`, `seat_capacity`, `status`) tied to `Course`. It drives *enrollment*, not marketing copy. These are currently unrelated and must not be conflated without a decision (see §F risk 4).

### 2. Success stories — 6 cards, `index.html` lines 3335–3560

Split across two **visual** marquee rows (`track-1`, `track-2`) that carry **no category meaning today**:

- track-1: Anand Gupta, Vasudha Singh, Shivam Tiwari
- track-2: Garvita Khurana, Sandeep Kumar, Pramit Shrestha

Per-card fields present in markup: avatar (`assets/<name>.png`), name, LinkedIn URL, category label (e.g. "MedTech Marketing → Founder"), growth-journey before-node, growth-journey after-node, testimonial paragraph, "Read Full Story" toggle.

**Gaps vs. PRD schema:** there is no `short_description`, no separate `full_story` (the toggle expands the same paragraph), and **no `linkedin_url` field in the PRD schema** although the live site uses one on every card.

### 3. Faculty — 4 cards, `index.html` line 4011ff

Gagan Victor, Shilpi Babbar, Dr. Vincent Keny PhD, Tabish.
Fields: portrait (`assets/*.jpg|png`), name, role, 1–3 badge capsules, bio paragraph.

**A second, divergent copy exists**: `src/components/Faculty.tsx` holds a hardcoded `mentors[]` array with only **3** of the 4 (no Tabish), a different bio for Gagan, different badges, and a different image path (`gagan_victor_headshot.png`). This component renders on the Next.js React pages. The two sources have already drifted — a live argument for the CMS.

**Gaps vs. PRD schema:** the live site has no `organization`, no `years_experience` integer, and no `short_bio`; `experience_display` exists only as one badge among others.

---

## C. Dependency audit — reuse, do not install

| PRD need | Already present | Verdict |
|---|---|---|
| Forms | `react-hook-form` ^7.82 | **Reuse** |
| Validation | `zod` ^4.4 + `@hookform/resolvers` | **Reuse** |
| ORM / DB | `prisma` ^7.9 + `@prisma/adapter-pg` + `pg` | **Reuse** |
| Storage | `@supabase/supabase-js` ^2.49 (service-role, private bucket) | **Reuse** |
| UI primitives | `src/components/ui/*`, `clsx`, `tailwind-merge`, `class-variance-authority` | **Reuse** |
| Animation | `motion` ^12.42 | **Reuse** |
| Auth | `@clerk/nextjs` ^7.5 — **installed but entirely unused in code** | **Decision required** (§E.2) |
| Rich text | none | **New — smallest viable option only** |
| Image optimisation | none (`sharp` not present) | **New, or defer** |
| Drag-and-drop | none | **New (`@dnd-kit/*`) or build with native HTML5 DnD** |

`@clerk/nextjs` is currently dead weight: the only `clerk` references in the codebase are the legacy column name `StaffUser.clerk_user_id`. Corresponding env vars are declared in `.env.local`.

---

## D. Existing files that matter

**Auth / data spine**
- `src/lib/auth.ts` — passcode session, `requireStaff(minRole)`, `AuthError`, `ROLE_RANK`
- `src/lib/db.ts` — Prisma singleton via pg adapter
- `src/lib/supabase.ts` — service-role storage client + bucket bootstrap
- `prisma/schema.prisma` — 18 models incl. `StaffUser`, `AuditLog`, `Document`

**Existing admin (the pattern to extend)**
- `src/app/admin/layout.tsx` — header, nav, sign-out; renders `<AdminLogin/>` when unauthed
- `src/app/admin/page.tsx` — dashboard; **re-checks `getStaff()` itself** with the comment "layouts aren't a reliable boundary in the App Router" — this per-page guard convention must be carried into every new CMS page
- `src/app/admin/ui.tsx` — badge/label/format helpers
- `src/app/admin/leads/{page,actions}.tsx` — the CRUD + server-action reference implementation

**Public content**
- `public/index.html` + root `index.html` (must stay mirrored — existing repo convention)
- `src/components/Faculty.tsx`, `src/app/foundation/landing-client.tsx`

**Storage/upload reference**
- `src/app/api/enroll/upload/route.ts` — MIME allow-list, size cap, authorisation-before-write

**Reusable audit table**
- `AuditLog` model (`actor_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `created_at`) already satisfies ~90% of the PRD's `activity_logs` spec.

---

## E. Recommended integration approach

### E.1 Public-site integration — the static-HTML problem

The PRD requires cohort/story/faculty content to become database-driven **while the public design stays byte-identical**. Three options:

| Option | Description | Verdict |
|---|---|---|
| **A. Port homepage to React** | Rebuild the 296 KB page as Server Components | **Rejected.** Directly violates "do not rebuild the public website". Weeks of work, high regression risk to animations/SEO/Meta Pixel |
| **B. Client-side hydration** | Ship a `/api/site-content` JSON endpoint; inline JS rewrites the DOM on load | **Rejected as primary.** PRD forbids blanket client fetching. Content flashes, is invisible to crawlers, and the marquee measures card widths at load |
| **C. Server-side template injection** | Replace the `/ → /index.html` rewrite with a Next.js route that reads the HTML, injects CMS data server-side, and returns it. Cached with `unstable_cache` + tag; publish calls `revalidateTag` | **Recommended** |

Option C keeps the design file exactly as authored, keeps rendering server-side (SEO and pixel behaviour unchanged), and gives real cache invalidation on publish. Implementation: mark the three dynamic regions in `index.html` with HTML-comment sentinels, e.g.

```html
<!--cms:cohort.start_date_long-->26 September 2026<!--/cms-->
<!--cms:success-stories-->…current cards…<!--/cms-->
```

Content between sentinels is replaced at request time from the DB. **If the database is empty or unreachable, the sentinel block's existing markup is served untouched** — which structurally guarantees the PRD's "production content must not disappear" requirement, and makes the migration reversible by deleting one route file.

The React surfaces (`foundation/*`, `Faculty.tsx`) become normal async Server Components reading the same `getCohort()` / `getFaculty()` helpers — no templating needed there.

### E.2 Auth — the shared passcode cannot satisfy this PRD

The PRD mandates per-user identity, three roles, a whitelist table, and activity logs attributed to a named person. The current passcode collapses *everyone* into one `StaffUser` row, so "Areeb Khan updated the cohort date" is unattributable in principle. This must change. Options:

| Option | Notes |
|---|---|
| **Clerk** | Already a dependency, env vars declared, `StaffUser.clerk_user_id` column already exists and is unique-indexed — the schema was clearly designed for it. Gives email verification (PRD step 2) for free. Adds a vendor + monthly cost. Needs live keys confirmed |
| **Extend passcode → per-user credentials** | Own the auth: `admin_users` table with per-user email + argon2/scrypt hash, own session cookie. No vendor, no cost. But we own password reset, lockout, and email verification |

Either way the authorisation model is identical and stays server-side: `requireCmsUser(minRole)` reads the session → looks up the whitelist row in `admin_users` → checks `status = active` → returns role. **Domain suffix is never sufficient on its own**, per the PRD.

### E.3 Database — extend, do not replace

Postgres-on-Supabase via Prisma is already production-grade. Add seven models to `prisma/schema.prisma` as a **new additive migration** (`cms_users`, `cms_sessions`, `cohort_settings`, `success_stories`, `faculty`, `faculty_expertise`, `content_versions`), and reuse `AuditLog` for activity logs rather than creating a parallel table.

RLS: these tables are reached only through Prisma using the pooler role, never from the browser. The safe posture is **RLS enabled with no permissive policies** (deny-all to `anon`/`authenticated`), matching how `leads`/`invoices` are already handled.

### E.4 Storage

Reuse Supabase Storage with a **new public bucket** `site-assets` (`faculty/`, `alumni/`), separate from the private `enrollment-docs`. Public-read is correct and necessary here — these images are already served publicly from `assets/`. Writes go only through an authenticated server route that reuses the existing upload route's validation shape.

---

## F. Risks

1. **`index.html` is edited by hand and by other sessions.** Sentinel comments can be clobbered by a careless find-and-replace. Mitigation: sentinels are inert comments; a missing sentinel degrades to "serve the static block", never to a crash. Add a build-time assertion that all expected sentinels are present.
2. **Root `index.html` and `public/index.html` already differ by 1 byte** and must be kept mirrored (existing repo convention). Any sentinel edit must be applied to both.
3. **Two divergent faculty sources have already drifted** (`index.html` has 4 members, `Faculty.tsx` has 3, with different bios). Migration must pick one as canonical — recommend `index.html` (the live homepage) — and the drift needs your confirmation of which bio is correct for Gagan Victor.
4. **`Batch.start_date` vs. marketing cohort date.** Two plausible sources of truth. Recommend `cohort_settings` stays the *marketing* record and is explicitly **not** wired into enrollment/payment logic in V1, to avoid a content edit silently changing what a paying customer is enrolled into.
5. **Dual hosting (Vercel + Firebase App Hosting).** New env vars must be registered in both, and `apphosting.yaml` is separate from Vercel's env store. Firebase cutover is mid-flight.
6. **No cache layer exists today**, so the revalidation strategy is being introduced from zero — an admin publish that fails to revalidate would silently show stale content. Mitigation: `revalidateTag` inside the same server action as the DB write, plus a visible "last published" timestamp in the CMS.
7. **The homepage marquee measures card widths in JS at load.** Rendering a different number of alumni cards than today is safe, but zero published cards would leave an empty track. Mitigation: the public query falls back to the static block when it returns no rows.
8. **`prisma generate` runs at build** and output is gitignored — new models require no extra deploy step, but a schema/DB mismatch fails the build rather than degrading. Migrations must be applied before deploy.

---

## G. Expected file changes

### Modified
- `prisma/schema.prisma` — seven new models + five enums, plus two nullable columns on `AuditLog`
- `next.config.ts` — drop the `/ → /index.html` rewrite in favour of the templating route
- `index.html` and `public/index.html` — insert CMS sentinel comments **only** (no design change)
- `src/lib/auth.ts` — add per-user session + `requireCmsUser(minRole)` alongside existing passcode CRM auth
- `src/app/admin/layout.tsx` — extend sidebar/nav for CMS sections
- `src/components/Faculty.tsx` — read from DB instead of the local array
- `src/app/foundation/page.tsx`, `src/app/foundation/landing-client.tsx` — consume `getCohort()`
- `.env.example` — document new variables
- `apphosting.yaml` — register new env vars for Firebase

### Created
- `prisma/migrations/<ts>_cms_v1/migration.sql`
- `prisma/seed-cms.ts` — seeds today's live content so nothing disappears
- `src/modules/cms/{schemas,queries,service,versioning,activity}.ts`
- `src/lib/site-content.ts` — cached public read helpers + `revalidateTag` keys
- `src/app/(site)/route.ts` (or `src/app/page.tsx`) — HTML templating route for `/`
- `src/app/admin/cohort/`, `src/app/admin/success-stories/{,new,[id]}`, `src/app/admin/faculty/{,new,[id]}`, `src/app/admin/activity/`, `src/app/admin/settings/`
- `src/app/api/admin/uploads/route.ts` — image upload
- `src/components/admin/` — form fields, image uploader, rich-text editor, DnD list, confirm dialog, empty/error states
- `docs/CMS_SETUP.md` — env vars, first super-admin, deploy steps

---

## H. Blocking decisions before Phase 1

1. **Auth**: Clerk (already a dependency, keys declared) vs. self-owned per-user credentials extending the current system?
2. **Public integration**: confirm Option C (server-side sentinel injection into the existing `index.html`)?
3. **Faculty canon**: `index.html`'s 4 members with its bios — correct?
4. **Content Editor role**: build all three roles in V1, or ship Super Admin + Content Admin and defer the editor?

Nothing is implemented until these are settled.
