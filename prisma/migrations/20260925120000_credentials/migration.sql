-- Credential Issuance & Verification System.
-- ADDITIVE ONLY: new enum values, new nullable/defaulted columns on "courses",
-- new tables, indexes, triggers and RLS. Nothing is dropped, renamed or
-- rewritten. Safe to re-run (guards on every object).

-- ── Roles ─────────────────────────────────────────────────────────
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'ISSUER';

-- ── Enums ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CredentialStatus" AS ENUM ('ISSUING', 'VALID', 'REVOKED', 'SUPERSEDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CertificateTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialEventType" AS ENUM (
    'ISSUE_REQUESTED', 'PDF_GENERATED', 'RENDER_FAILED', 'ISSUED',
    'EMAIL_SENT', 'EMAIL_FAILED', 'EMAIL_SUPPRESSED', 'EMAIL_RESENT',
    'REVOKED', 'REISSUED', 'SUPERSEDED', 'STATUS_CHANGED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SUPPRESSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialBulkJobStatus" AS ENUM ('VALIDATED', 'PROCESSING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialBulkRowValidation" AS ENUM ('VALID', 'WARNING', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CredentialBulkRowOutcome" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'DUPLICATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Program (course) credential configuration ─────────────────────
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "validity_months" INTEGER;
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "validity_anchor" TEXT NOT NULL DEFAULT 'COMPLETION';
ALTER TABLE "public"."courses" ADD COLUMN IF NOT EXISTS "certificate_title" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_key" ON "public"."courses"("code");

DO $$ BEGIN
  ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_code_format"
    CHECK ("code" IS NULL OR "code" ~ '^[A-Z0-9]{2,10}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_validity_months_positive"
    CHECK ("validity_months" IS NULL OR ("validity_months" > 0 AND "validity_months" <= 600));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_validity_anchor_values"
    CHECK ("validity_anchor" IN ('COMPLETION', 'ISSUE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── certificate_templates ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."certificate_templates" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "course_id"     TEXT NOT NULL,
  "version"       INTEGER NOT NULL,
  "name"          TEXT NOT NULL,
  "status"        "CertificateTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "is_production" BOOLEAN NOT NULL DEFAULT false,
  "background"    JSONB NOT NULL,
  "field_config"  JSONB NOT NULL,
  "signatures"    JSONB NOT NULL DEFAULT '[]',
  "notes"         TEXT,
  "created_by_id" TEXT,
  "activated_at"  TIMESTAMPTZ(6),
  "retired_at"    TIMESTAMPTZ(6),
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "certificate_templates_version_positive" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_templates_course_id_version_key"
  ON "public"."certificate_templates"("course_id", "version");
CREATE INDEX IF NOT EXISTS "certificate_templates_course_id_status_idx"
  ON "public"."certificate_templates"("course_id", "status");
-- At most one ACTIVE template per program, so "which template issues this
-- program's certificates" always has exactly one answer.
CREATE UNIQUE INDEX IF NOT EXISTS "certificate_templates_one_active_per_course"
  ON "public"."certificate_templates"("course_id") WHERE "status" = 'ACTIVE';

-- ── credentials ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."credentials" (
  "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
  "certificate_id"     TEXT NOT NULL,
  "verification_token" TEXT NOT NULL,
  "idempotency_key"    TEXT NOT NULL,
  "student_id"         TEXT NOT NULL,
  "course_id"          TEXT NOT NULL,
  "batch_id"           TEXT,
  "template_id"        UUID NOT NULL,
  "learner_name"       TEXT NOT NULL,
  "program_name"       TEXT NOT NULL,
  "completion_date"    DATE NOT NULL,
  "completion_context" TEXT,
  "issued_at"          TIMESTAMPTZ(6) NOT NULL,
  "expires_at"         DATE,
  "status"             "CredentialStatus" NOT NULL DEFAULT 'ISSUING',
  "dedupe_key"         TEXT,
  "source"             TEXT NOT NULL DEFAULT 'SINGLE',
  "pdf_path"           TEXT,
  "pdf_sha256"         TEXT,
  "render_attempts"    INTEGER NOT NULL DEFAULT 0,
  "lease_until"        TIMESTAMPTZ(6),
  "last_error"         TEXT,
  "supersedes_id"      UUID,
  "revoked_at"         TIMESTAMPTZ(6),
  "revoked_by_id"      TEXT,
  "revocation_reason"  TEXT,
  "created_by_id"      TEXT NOT NULL,
  "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "credentials_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "credentials_source_values" CHECK ("source" IN ('SINGLE', 'BULK', 'REISSUE')),
  CONSTRAINT "credentials_token_shape" CHECK ("verification_token" ~ '^[A-Za-z0-9_-]{22,64}$'),
  CONSTRAINT "credentials_valid_has_pdf" CHECK ("status" NOT IN ('VALID', 'REVOKED', 'SUPERSEDED') OR ("pdf_path" IS NOT NULL AND "pdf_sha256" IS NOT NULL)),
  CONSTRAINT "credentials_revoked_has_actor" CHECK ("status" <> 'REVOKED' OR ("revoked_at" IS NOT NULL AND "revoked_by_id" IS NOT NULL)),
  CONSTRAINT "credentials_not_self_superseding" CHECK ("supersedes_id" IS NULL OR "supersedes_id" <> "id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_certificate_id_key" ON "public"."credentials"("certificate_id");
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_verification_token_key" ON "public"."credentials"("verification_token");
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_idempotency_key_key" ON "public"."credentials"("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_supersedes_id_key" ON "public"."credentials"("supersedes_id");
CREATE INDEX IF NOT EXISTS "credentials_student_id_idx" ON "public"."credentials"("student_id");
CREATE INDEX IF NOT EXISTS "credentials_course_id_batch_id_idx" ON "public"."credentials"("course_id", "batch_id");
CREATE INDEX IF NOT EXISTS "credentials_status_idx" ON "public"."credentials"("status");
CREATE INDEX IF NOT EXISTS "credentials_issued_at_idx" ON "public"."credentials"("issued_at" DESC);
CREATE INDEX IF NOT EXISTS "credentials_created_at_idx" ON "public"."credentials"("created_at" DESC);
-- The duplicate rule: one live credential per dedupe key. Only ISSUING/VALID
-- rows participate, so revoked, superseded and failed rows never block a
-- legitimate new issue. The key itself is computed in application code
-- (src/modules/credentials/dedupe.ts), so the rule can change without a
-- destructive schema change.
CREATE UNIQUE INDEX IF NOT EXISTS "credentials_dedupe_active_key"
  ON "public"."credentials"("dedupe_key")
  WHERE "dedupe_key" IS NOT NULL AND "status" IN ('ISSUING', 'VALID');

-- ── credential_events (append-only) ───────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."credential_events" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "credential_id" UUID NOT NULL,
  "type"          "CredentialEventType" NOT NULL,
  "actor_id"      TEXT,
  "metadata"      JSONB NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credential_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "credential_events_credential_id_created_at_idx" ON "public"."credential_events"("credential_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_events_type_created_at_idx" ON "public"."credential_events"("type", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_events_actor_id_created_at_idx" ON "public"."credential_events"("actor_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_events_created_at_idx" ON "public"."credential_events"("created_at" DESC);

-- ── credential_email_deliveries ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."credential_email_deliveries" (
  "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
  "credential_id"       UUID NOT NULL,
  "kind"                TEXT NOT NULL,
  "recipient"           TEXT NOT NULL,
  "status"              "CredentialEmailStatus" NOT NULL DEFAULT 'PENDING',
  "provider_message_id" TEXT,
  "attempts"            INTEGER NOT NULL DEFAULT 0,
  "last_error"          TEXT,
  "last_attempt_at"     TIMESTAMPTZ(6),
  "triggered_by_id"     TEXT,
  "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "credential_email_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "credential_email_deliveries_kind_values" CHECK ("kind" IN ('ISSUED', 'RESEND'))
);
CREATE INDEX IF NOT EXISTS "credential_email_deliveries_credential_id_created_at_idx" ON "public"."credential_email_deliveries"("credential_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_email_deliveries_status_created_at_idx" ON "public"."credential_email_deliveries"("status", "created_at" DESC);

-- ── credential_bulk_jobs / credential_bulk_rows ───────────────────
CREATE TABLE IF NOT EXISTS "public"."credential_bulk_jobs" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
  "course_id"       TEXT NOT NULL,
  "batch_id"        TEXT,
  "template_id"     UUID NOT NULL,
  "file_name"       TEXT NOT NULL,
  "file_sha256"     TEXT NOT NULL,
  "status"          "CredentialBulkJobStatus" NOT NULL DEFAULT 'VALIDATED',
  "send_email"      BOOLEAN NOT NULL DEFAULT true,
  "total_rows"      INTEGER NOT NULL DEFAULT 0,
  "created_by_id"   TEXT NOT NULL,
  "confirmed_by_id" TEXT,
  "confirmed_at"    TIMESTAMPTZ(6),
  "completed_at"    TIMESTAMPTZ(6),
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "credential_bulk_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "credential_bulk_jobs_created_at_idx" ON "public"."credential_bulk_jobs"("created_at" DESC);

CREATE TABLE IF NOT EXISTS "public"."credential_bulk_rows" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id"        UUID NOT NULL,
  "row_number"    INTEGER NOT NULL,
  "input"         JSONB NOT NULL,
  "validation"    "CredentialBulkRowValidation" NOT NULL,
  "messages"      JSONB NOT NULL DEFAULT '[]',
  "outcome"       "CredentialBulkRowOutcome" NOT NULL DEFAULT 'PENDING',
  "credential_id" UUID,
  "error"         TEXT,
  "processed_at"  TIMESTAMPTZ(6),
  CONSTRAINT "credential_bulk_rows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "credential_bulk_rows_job_id_row_number_key" ON "public"."credential_bulk_rows"("job_id", "row_number");
CREATE INDEX IF NOT EXISTS "credential_bulk_rows_job_id_outcome_idx" ON "public"."credential_bulk_rows"("job_id", "outcome");

-- ── Foreign keys ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "public"."certificate_templates" ADD CONSTRAINT "certificate_templates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "public"."credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credentials" ADD CONSTRAINT "credentials_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."credential_events" ADD CONSTRAINT "credential_events_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_events" ADD CONSTRAINT "credential_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."credential_email_deliveries" ADD CONSTRAINT "credential_email_deliveries_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_email_deliveries" ADD CONSTRAINT "credential_email_deliveries_triggered_by_id_fkey" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_jobs" ADD CONSTRAINT "credential_bulk_jobs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_jobs" ADD CONSTRAINT "credential_bulk_jobs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_jobs" ADD CONSTRAINT "credential_bulk_jobs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_jobs" ADD CONSTRAINT "credential_bulk_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_jobs" ADD CONSTRAINT "credential_bulk_jobs_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_rows" ADD CONSTRAINT "credential_bulk_rows_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."credential_bulk_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "public"."credential_bulk_rows" ADD CONSTRAINT "credential_bulk_rows_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Integrity triggers ────────────────────────────────────────────

-- 1. credential_events is append-only.
CREATE OR REPLACE FUNCTION "public"."credential_events_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'credential_events is append-only (% refused)', TG_OP USING ERRCODE = 'insufficient_privilege';
END $$;

DROP TRIGGER IF EXISTS "credential_events_no_update_delete" ON "public"."credential_events";
CREATE TRIGGER "credential_events_no_update_delete"
  BEFORE UPDATE OR DELETE ON "public"."credential_events"
  FOR EACH ROW EXECUTE FUNCTION "public"."credential_events_append_only"();
DROP TRIGGER IF EXISTS "credential_events_no_truncate" ON "public"."credential_events";
CREATE TRIGGER "credential_events_no_truncate"
  BEFORE TRUNCATE ON "public"."credential_events"
  FOR EACH STATEMENT EXECUTE FUNCTION "public"."credential_events_append_only"();

-- 2. Credentials are never hard-deleted, identifiers never change, printed
--    content is frozen once issued, and REVOKED/SUPERSEDED are terminal.
CREATE OR REPLACE FUNCTION "public"."credentials_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'credentials are never deleted; revoke instead' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW."certificate_id" IS DISTINCT FROM OLD."certificate_id"
     OR NEW."verification_token" IS DISTINCT FROM OLD."verification_token"
     OR NEW."idempotency_key" IS DISTINCT FROM OLD."idempotency_key"
     OR NEW."created_by_id" IS DISTINCT FROM OLD."created_by_id"
     OR NEW."created_at" IS DISTINCT FROM OLD."created_at" THEN
    RAISE EXCEPTION 'credential identifiers are immutable' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF OLD."status" IN ('VALID', 'REVOKED', 'SUPERSEDED') AND (
       NEW."student_id" IS DISTINCT FROM OLD."student_id"
    OR NEW."course_id" IS DISTINCT FROM OLD."course_id"
    OR NEW."template_id" IS DISTINCT FROM OLD."template_id"
    OR NEW."learner_name" IS DISTINCT FROM OLD."learner_name"
    OR NEW."program_name" IS DISTINCT FROM OLD."program_name"
    OR NEW."completion_date" IS DISTINCT FROM OLD."completion_date"
    OR NEW."issued_at" IS DISTINCT FROM OLD."issued_at"
    OR NEW."expires_at" IS DISTINCT FROM OLD."expires_at"
    OR NEW."pdf_path" IS DISTINCT FROM OLD."pdf_path"
    OR NEW."pdf_sha256" IS DISTINCT FROM OLD."pdf_sha256"
    OR NEW."supersedes_id" IS DISTINCT FROM OLD."supersedes_id") THEN
    RAISE EXCEPTION 'an issued credential cannot be edited; reissue instead' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    IF NOT (
         (OLD."status" = 'ISSUING' AND NEW."status" IN ('VALID', 'FAILED'))
      OR (OLD."status" = 'FAILED'  AND NEW."status" = 'ISSUING')
      OR (OLD."status" = 'VALID'   AND NEW."status" IN ('REVOKED', 'SUPERSEDED'))
    ) THEN
      RAISE EXCEPTION 'illegal credential status transition % -> %', OLD."status", NEW."status"
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "credentials_guard" ON "public"."credentials";
CREATE TRIGGER "credentials_guard"
  BEFORE UPDATE OR DELETE ON "public"."credentials"
  FOR EACH ROW EXECUTE FUNCTION "public"."credentials_guard"();

-- 3. A template is editable only while DRAFT. Once ACTIVE/RETIRED its artwork,
--    layout and signatures are frozen so issued certificates stay reproducible.
CREATE OR REPLACE FUNCTION "public"."certificate_templates_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" <> 'DRAFT' THEN
      RAISE EXCEPTION 'only DRAFT templates can be deleted' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD."status" <> 'DRAFT' AND (
       NEW."course_id" IS DISTINCT FROM OLD."course_id"
    OR NEW."version" IS DISTINCT FROM OLD."version"
    OR NEW."is_production" IS DISTINCT FROM OLD."is_production"
    OR NEW."background" IS DISTINCT FROM OLD."background"
    OR NEW."field_config" IS DISTINCT FROM OLD."field_config"
    OR NEW."signatures" IS DISTINCT FROM OLD."signatures") THEN
    RAISE EXCEPTION 'an activated template is immutable; create a new version' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
       (OLD."status" = 'DRAFT' AND NEW."status" = 'ACTIVE')
    OR (OLD."status" = 'ACTIVE' AND NEW."status" = 'RETIRED')) THEN
    RAISE EXCEPTION 'illegal template status transition % -> %', OLD."status", NEW."status"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "certificate_templates_guard" ON "public"."certificate_templates";
CREATE TRIGGER "certificate_templates_guard"
  BEFORE UPDATE OR DELETE ON "public"."certificate_templates"
  FOR EACH ROW EXECUTE FUNCTION "public"."certificate_templates_guard"();

-- ── Row Level Security: service_role only (no anon/authenticated policies) ──
-- Supabase exposes the public schema over PostgREST; without RLS these tables
-- would be readable with the public anon key. The app reaches them through
-- Prisma as the table owner, which RLS does not restrict.
ALTER TABLE "public"."certificate_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credential_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credential_email_deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credential_bulk_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credential_bulk_rows" ENABLE ROW LEVEL SECURITY;
