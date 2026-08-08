# Phase 1 Execution Checklist (CRM Foundation)

- [x] 1. Install prisma + @prisma/client; introspect existing tables (`db pull`)
- [x] 2. Extend schema.prisma with funnel entities (StaffUser, Student, Activity, Course, Batch, EnrollmentLink, Enrollment, PaymentSchedule, PaymentTransaction, CommunicationLog, Document, AuditLog, WebhookEvent + lead funnel columns)
- [x] 3. Baseline existing schema (0_init, migrate resolve) — no DROPs ever
- [x] 4. Additive migration: new tables + new leads columns + RLS policies
- [x] 5. src/lib/db.ts (Prisma singleton), src/lib/auth.ts (requireStaff)
- [x] 6. Clerk webhook route → staff_users sync; seed script for first ADMIN
- [x] 7. /admin shell: layout + funnel dashboard
- [x] 8. /admin/leads list (search/filter/paginate) + /admin/leads/[id] detail w/ timeline + transitions
- [x] 9. (kept legacy endpoints untouched; new CRM reads DB directly) modules/leads service/schemas/queries; port legacy /api/leads (GET) to App Router
- [x] 10. (final smoke of signed-in flow pending first Clerk user) Verify: type-check, build, migrate status, smoke test in browser, regression on public APIs
