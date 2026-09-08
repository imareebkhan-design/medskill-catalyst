# Why there are two rate limiters

Decision: **keep `src/lib/rate-limit.ts` and `src/lib/cms-rate-limit.ts` separate.**
Date: 8 September 2026

The two look similar enough that merging them is an obvious suggestion. They
were compared properly before that was rejected.

## What each one guards

| | `rate-limit.ts` (CRM) | `cms-rate-limit.ts` (CMS) |
|---|---|---|
| Protects | the **shared admin passcode** — `/admin`, careers-admin API, invoices API | **per-user CMS login** at `/cms/login` |
| Table | `admin_auth_attempts` — one counter row per key, updated by a single raw-SQL upsert | `cms_login_attempts` — one row per failed attempt |
| Window | fixed | sliding |
| Keyed by | `clientKey(headers, surface)` — client + surface only | **email identifier and client IP, counted independently** |
| Layers | in-process counter **plus** Postgres | Postgres only |
| On DB error | fails open; the in-process counter still holds | fails open |

## Why they cannot share a key model

The CRM authenticates with **one shared secret**. There is no user identity to
count against, so it can only key on the caller. The CMS authenticates
**individual accounts**, and its primary control is per-email — that is the
dimension that actually bounds guessing against a *known* account, and it is
non-spoofable because the attacker has to submit the address they are
attacking.

Merging them would mean either inventing a phantom identifier for the CRM or
dropping the per-email dimension from the CMS. Both make the result worse than
either input.

## Why the CRM's in-process layer does not transfer

`rate-limit.ts` keeps a second, in-process counter for a specific reason: the
passcode-gated API routes read Supabase over HTTP and never touch Postgres, so
they keep serving real applicant and invoice data through a Postgres outage. A
Postgres-only limiter that failed open would leave exactly those endpoints
unguarded at exactly that moment.

CMS auth has no equivalent exposure. Every authenticated CMS request reads
`cms_sessions` from Postgres. If Postgres is down, CMS login cannot succeed at
all — there is no window in which an unguarded endpoint keeps serving data, so
a second counter would guard nothing.

## Cost of keeping them separate

Two tables and some conceptual overlap. Accepted, because the alternative
couples two independent authentication systems: a change to the CRM's limiter
could then regress CMS login, and vice versa. Each limiter is small, is shaped
to its own threat model, and can be reasoned about on its own.

## What would change this

If the CRM ever moves to per-user credentials, the two key models converge and
merging becomes worth revisiting. Until then, they stay apart.
