-- Brute-force guard for the shared admin passcode (src/lib/rate-limit.ts).
-- One row per client key, reused and reset in place rather than appended to.
-- Additive + idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS "public"."admin_auth_attempts" (
  "key"          TEXT NOT NULL,
  "failures"     INTEGER NOT NULL DEFAULT 0,
  "window_start" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "admin_auth_attempts_pkey" PRIMARY KEY ("key")
);

-- Supports the periodic sweep of windows that have long since elapsed.
CREATE INDEX IF NOT EXISTS "admin_auth_attempts_window_start_idx"
  ON "public"."admin_auth_attempts"("window_start");
