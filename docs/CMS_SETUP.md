# MedSkills CMS — setup guide

Covers Phase 3 (authentication). Later phases append to this file.

---

## 1. Environment variables

**Phase 3 introduces no new environment variables.** Authentication reuses the
database connection the app already has:

| Variable | Used for | Already present |
|---|---|---|
| `DATABASE_URL` | Runtime queries (Supabase transaction pooler) | yes |
| `DIRECT_URL` | Migrations and the admin-bootstrap script | yes |

There is deliberately **no `CMS_SESSION_SECRET`**. Session tokens are 256 bits
of CSPRNG output stored as SHA-256 hashes, so there is no signing key to
manage, rotate, or leak. Revocation is a row delete.

---

## 2. Apply the database migration

The CMS tables must exist before anyone can sign in.

```bash
npx prisma migrate deploy
```

This applies `prisma/migrations/20260907120000_cms_v1/`, which is additive and
idempotent: it creates new types and tables and adds two **nullable** columns to
`audit_logs`. It alters no existing column and drops nothing.

Verify it landed:

```bash
npx prisma migrate status
```

---

## 3. Create the first Super Admin

There is no sign-up page, by design — the very first account cannot be created
through the browser. Use the bootstrap script.

> **Always name the target database explicitly.** The script loads
> `.env.local`, which on this project points at **production**. It now refuses
> to run against a non-local host unless `CMS_ALLOW_REMOTE=1` is set, and it
> prints the target database before prompting — but pass the connection
> anyway, so intent is never implicit.

For local development:

```bash
DIRECT_URL="postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev" npx tsx scripts/create-cms-admin.ts
```

For the real production database, deliberately:

```bash
CMS_ALLOW_REMOTE=1 npm run cms:create-admin
```

It will prompt for:

1. **Email** — validated for shape, lower-cased, and checked for duplicates
   *before* anything else is asked.
2. **Full name**
3. **Role** — press Enter for `super_admin`; also accepts `content_admin`
   or `content_editor`.
4. **Password** — typed twice, with terminal echo disabled.

Requirements: at least 12 characters, including one letter and one number.

Then sign in at **`/cms/login`**.

### Why a script and not a web page

- Credentials are **prompted for, never passed as arguments** — `argv` is
  visible in shell history and to `ps` on a shared machine.
- The password is read with **echo off**, is never printed, never logged, and
  never written to disk.
- It is hashed with **the same production scrypt implementation** the login
  route uses (`src/lib/password.ts`), so there is no second code path that
  could drift.
- **No credentials live in source control** or in environment variables.
- Re-running with an existing email changes nothing and exits non-zero.
- It refuses to run outside an interactive terminal (no TTY → no silent
  scripted account creation).

---

## 4. Adding more team members

Until the Team settings screen ships (Phase 8), use the same script and choose
a role at the prompt:

```bash
npm run cms:create-admin
# Role [super_admin]: content_admin
```

---

## 5. Roles

| Role | Can do | Cannot do |
|---|---|---|
| **Super Admin** | Everything: content, publishing, team management, activity log, version rollback, settings | — |
| **Content Admin** | Create, edit, reorder, archive and **publish** all content | Manage team, permanently delete, restore versions, open settings |
| **Content Editor** | Create and edit content, save drafts | **Publish**, archive, reorder, delete, manage team, open settings |

Authorisation is enforced **server-side on every page and action**. Hiding a
button in the UI is treated as cosmetic, never as a control.

Access requires a `cms_users` row with `status = ACTIVE`. An
`@medskillscatalyst.com` address on its own grants nothing.

---

## 6. Sessions

- Cookie `msc_cms` — `httpOnly`, `sameSite=lax`, `secure` in production.
- 12-hour expiry.
- The cookie holds a random token; the database stores only its SHA-256 hash,
  so a database dump cannot be replayed as a login.
- Every request re-reads the user row, so **disabling an account or changing a
  role takes effect on the next request**, not at session expiry.
- Signing out deletes the session row, not just the cookie.

---

## 7. Running the tests

```bash
npm test
```

Uses Node's built-in test runner through the existing `tsx` dev dependency —
no test framework was added.
