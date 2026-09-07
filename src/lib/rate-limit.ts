import "server-only";
import { db } from "@/src/lib/db";

/**
 * Brute-force guard for the shared admin passcode.
 *
 * Two counters, and a caller is refused if either one trips:
 *
 *  - An in-process counter. Always available and free, but each serverless
 *    instance keeps its own, so on its own it only bounds what a single
 *    instance will accept.
 *  - A Postgres counter, shared by every instance.
 *
 * Both exist deliberately. The passcode-gated API routes (careers admin,
 * invoices) read from Supabase over HTTP and never touch Postgres, so they keep
 * serving real applicant and invoice data through a Postgres outage. A
 * Postgres-only limiter that failed open would leave precisely those endpoints
 * unguarded at precisely that moment; the in-process counter still holds there.
 *
 * The Postgres layer fails OPEN on error. Locking every admin out because the
 * database is unreachable would be a self-inflicted outage — the same mistake
 * as reporting a database failure as a bad passcode — and the in-process
 * counter still applies while it is down.
 *
 * The window is fixed, not sliding: a caller who exhausts one window can start
 * again the moment the next one opens. That is the accepted trade for a counter
 * that is cheap to reason about and cheap to store.
 */

export type RateLimitConfig = { limit: number; windowSeconds: number };

/** Failed passcode attempts tolerated per client, per window. */
export const ADMIN_AUTH_RATE_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 15 * 60 };

/**
 * `hadFailures` lets a caller skip clearing a client that has nothing recorded.
 * The careers dashboard re-sends the passcode on every request, so clearing
 * unconditionally would mean a database write per authenticated call.
 */
export type RateLimitVerdict =
  | { blocked: false; hadFailures: boolean }
  | { blocked: true; retryAfterSeconds: number };

const ALLOWED: RateLimitVerdict = { blocked: false, hadFailures: false };

// ── Client key ─────────────────────────────────────────────────────
/**
 * Identify the caller for counting purposes.
 *
 * `x-real-ip` is preferred: Vercel sets it to the connecting client and a
 * request cannot forge it. `x-forwarded-for` is only a fallback, and only its
 * first entry, since a client may prepend entries of its own.
 *
 * When neither header is present every such caller shares one bucket. That is
 * deliberate — failing closed onto a shared bucket is safer here than handing
 * out an unlimited allowance to anything that arrives without headers.
 */
export function clientKey(headers: Headers, surface: string): string {
  const realIp = headers.get("x-real-ip")?.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${surface}:${realIp || forwarded || "unknown"}`;
}

// ── In-process counter ─────────────────────────────────────────────
type Bucket = { failures: number; windowStartMs: number };

const memory = new Map<string, Bucket>();
// Bound the map so a distributed attack cannot grow it without limit. Evicting
// the oldest insertion loses some history; the Postgres counter is the durable
// one and is unaffected.
const MEMORY_MAX_KEYS = 10_000;

function liveBucket(key: string, windowMs: number, now: number): Bucket | null {
  const bucket = memory.get(key);
  if (!bucket) return null;
  if (now - bucket.windowStartMs >= windowMs) {
    memory.delete(key);
    return null;
  }
  return bucket;
}

function memoryVerdict(key: string, cfg: RateLimitConfig, now: number): RateLimitVerdict {
  const windowMs = cfg.windowSeconds * 1000;
  const bucket = liveBucket(key, windowMs, now);
  if (!bucket) return ALLOWED;
  if (bucket.failures < cfg.limit) return { blocked: false, hadFailures: bucket.failures > 0 };
  const msLeft = bucket.windowStartMs + windowMs - now;
  return { blocked: true, retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)) };
}

function memoryRecord(key: string, cfg: RateLimitConfig, now: number): void {
  const bucket = liveBucket(key, cfg.windowSeconds * 1000, now);
  if (bucket) {
    bucket.failures += 1;
    return;
  }
  if (memory.size >= MEMORY_MAX_KEYS) {
    const oldest = memory.keys().next();
    if (!oldest.done) memory.delete(oldest.value);
  }
  memory.set(key, { failures: 1, windowStartMs: now });
}

// ── Postgres counter ───────────────────────────────────────────────
function verdictFrom(
  failures: number,
  windowStart: Date,
  cfg: RateLimitConfig,
  now: number,
): RateLimitVerdict {
  const msLeft = windowStart.getTime() + cfg.windowSeconds * 1000 - now;
  if (msLeft <= 0) return ALLOWED; // stored window already elapsed
  if (failures < cfg.limit) return { blocked: false, hadFailures: failures > 0 };
  return { blocked: true, retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)) };
}

async function dbVerdict(key: string, cfg: RateLimitConfig, now: number): Promise<RateLimitVerdict> {
  const row = await db.adminAuthAttempt.findUnique({ where: { key } });
  if (!row) return ALLOWED;
  return verdictFrom(row.failures, row.window_start, cfg, now);
}

/**
 * Increment the shared counter, resetting it first when the stored window has
 * already elapsed. Done as one statement so concurrent requests cannot each
 * read a stale count and write back the same value.
 */
async function dbRecord(key: string, cfg: RateLimitConfig): Promise<void> {
  await db.$executeRaw`
    INSERT INTO "public"."admin_auth_attempts" ("key", "failures", "window_start", "updated_at")
    VALUES (${key}, 1, now(), now())
    ON CONFLICT ("key") DO UPDATE SET
      "failures" = CASE
        WHEN "admin_auth_attempts"."window_start"
             <= now() - make_interval(secs => ${cfg.windowSeconds}::double precision)
        THEN 1
        ELSE "admin_auth_attempts"."failures" + 1
      END,
      "window_start" = CASE
        WHEN "admin_auth_attempts"."window_start"
             <= now() - make_interval(secs => ${cfg.windowSeconds}::double precision)
        THEN now()
        ELSE "admin_auth_attempts"."window_start"
      END,
      "updated_at" = now()
  `;
}

// Rows are one per client key and are reused, so they only accumulate under a
// distributed attack. Sweep expired ones occasionally rather than on every
// write — this is housekeeping, not part of the decision.
const SWEEP_PROBABILITY = 0.02;

async function sweepExpired(cfg: RateLimitConfig): Promise<void> {
  if (Math.random() >= SWEEP_PROBABILITY) return;
  await db.$executeRaw`
    DELETE FROM "public"."admin_auth_attempts"
    WHERE "window_start" <= now() - make_interval(secs => ${cfg.windowSeconds * 4}::double precision)
  `;
}

// ── Public API ─────────────────────────────────────────────────────

/** Ask whether this client has already spent its allowance. Does not consume. */
export async function checkAdminAuthRateLimit(
  key: string,
  cfg: RateLimitConfig = ADMIN_AUTH_RATE_LIMIT,
): Promise<RateLimitVerdict> {
  const now = Date.now();
  const inProcess = memoryVerdict(key, cfg, now);
  if (inProcess.blocked) return inProcess;
  try {
    const shared = await dbVerdict(key, cfg, now);
    if (shared.blocked) return shared;
    return { blocked: false, hadFailures: inProcess.hadFailures || shared.hadFailures };
  } catch (err) {
    console.error("[rate-limit] shared counter unavailable, in-process only:", err);
    return inProcess;
  }
}

/** Count one rejected passcode against this client. */
export async function recordAdminAuthFailure(
  key: string,
  cfg: RateLimitConfig = ADMIN_AUTH_RATE_LIMIT,
): Promise<void> {
  memoryRecord(key, cfg, Date.now());
  try {
    await dbRecord(key, cfg);
    await sweepExpired(cfg);
  } catch (err) {
    console.error("[rate-limit] could not record failure in shared counter:", err);
  }
}

/** Forget this client's failures — called once a correct passcode arrives. */
export async function clearAdminAuthFailures(key: string): Promise<void> {
  memory.delete(key);
  try {
    await db.adminAuthAttempt.deleteMany({ where: { key } });
  } catch (err) {
    console.error("[rate-limit] could not clear failures in shared counter:", err);
  }
}

/** Shown to a caller who has run out of attempts. Deliberately vague on limits. */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many incorrect passcode attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
