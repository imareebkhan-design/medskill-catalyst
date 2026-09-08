-- CMS v1 — cohort settings, success stories, faculty, admin users, versioning.
-- Purely ADDITIVE and idempotent: creates new types/tables and adds two
-- nullable columns to audit_logs. No existing column is altered or dropped,
-- so this is safe to apply to production and safe to re-run.

-- ── Enums ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."CmsRole" AS ENUM ('SUPER_ADMIN', 'CONTENT_ADMIN', 'CONTENT_EDITOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."CmsUserStatus" AS ENUM ('ACTIVE', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."AdmissionsStatus" AS ENUM ('OPEN', 'CLOSING_SOON', 'CLOSED', 'COMING_SOON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."AlumniCategory" AS ENUM ('COHORT_ALUMNI', 'ADVANCED_MODULE_ALUMNI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── cms_users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."cms_users" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "email"         TEXT NOT NULL,
    "full_name"     TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role"          "public"."CmsRole" NOT NULL DEFAULT 'CONTENT_EDITOR',
    "status"        "public"."CmsUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cms_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "cms_users_email_key" ON "public"."cms_users"("email");
CREATE INDEX IF NOT EXISTS "cms_users_status_idx" ON "public"."cms_users"("status");

-- ── cms_sessions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."cms_sessions" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "user_id"    UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    CONSTRAINT "cms_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "cms_sessions_token_hash_key" ON "public"."cms_sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "cms_sessions_user_id_idx"    ON "public"."cms_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "cms_sessions_expires_at_idx" ON "public"."cms_sessions"("expires_at");

DO $$ BEGIN
  ALTER TABLE "public"."cms_sessions"
    ADD CONSTRAINT "cms_sessions_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "public"."cms_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── cohort_settings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."cohort_settings" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohort_name"       TEXT NOT NULL,
    "start_date"        DATE NOT NULL,
    "start_time"        VARCHAR(5),
    "admissions_status" "public"."AdmissionsStatus" NOT NULL DEFAULT 'OPEN',
    "duration"          TEXT,
    "registration_url"  TEXT,
    "is_active"         BOOLEAN NOT NULL DEFAULT true,
    "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id"     UUID,
    CONSTRAINT "cohort_settings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "cohort_settings_is_active_idx" ON "public"."cohort_settings"("is_active");

-- "ONE SINGLE SOURCE OF TRUTH" enforced by the database, not by application
-- code: at most one row may be active at any time.
CREATE UNIQUE INDEX IF NOT EXISTS "cohort_settings_single_active_idx"
  ON "public"."cohort_settings"(("is_active")) WHERE "is_active";

DO $$ BEGIN
  ALTER TABLE "public"."cohort_settings"
    ADD CONSTRAINT "cohort_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id")
    REFERENCES "public"."cms_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── success_stories ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."success_stories" (
    "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
    "category"             "public"."AlumniCategory" NOT NULL,
    "full_name"            TEXT NOT NULL,
    "profile_image_url"    TEXT,
    "linkedin_url"         TEXT,
    "previous_company"     TEXT,
    "previous_designation" TEXT,
    "current_company"      TEXT,
    "current_designation"  TEXT,
    "growth_headline"      TEXT,
    "growth_description"   TEXT,
    "short_description"    TEXT,
    "full_story"           TEXT,
    "testimonial"          TEXT,
    "status"               "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order"        INTEGER NOT NULL DEFAULT 0,
    "created_by_id"        UUID,
    "updated_by_id"        UUID,
    "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at"         TIMESTAMPTZ(6),
    "archived_at"          TIMESTAMPTZ(6),
    "deleted_at"           TIMESTAMPTZ(6),
    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "success_stories_category_status_display_order_idx"
  ON "public"."success_stories"("category", "status", "display_order");
CREATE INDEX IF NOT EXISTS "success_stories_status_idx"     ON "public"."success_stories"("status");
CREATE INDEX IF NOT EXISTS "success_stories_deleted_at_idx" ON "public"."success_stories"("deleted_at");

-- ── faculty ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."faculty" (
    "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name"          TEXT NOT NULL,
    "profile_image_url"  TEXT,
    "designation"        TEXT NOT NULL,
    "organization"       TEXT,
    "years_experience"   INTEGER,
    "experience_display" TEXT,
    "short_bio"          TEXT,
    "full_bio"           TEXT,
    "status"             "public"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "display_order"      INTEGER NOT NULL DEFAULT 0,
    "created_by_id"      UUID,
    "updated_by_id"      UUID,
    "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at"       TIMESTAMPTZ(6),
    "archived_at"        TIMESTAMPTZ(6),
    "deleted_at"         TIMESTAMPTZ(6),
    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "faculty_status_display_order_idx" ON "public"."faculty"("status", "display_order");
CREATE INDEX IF NOT EXISTS "faculty_deleted_at_idx"           ON "public"."faculty"("deleted_at");

-- ── faculty_expertise ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."faculty_expertise" (
    "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
    "faculty_id"     UUID NOT NULL,
    "expertise_name" TEXT NOT NULL,
    "display_order"  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "faculty_expertise_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "faculty_expertise_faculty_id_display_order_idx"
  ON "public"."faculty_expertise"("faculty_id", "display_order");

DO $$ BEGIN
  ALTER TABLE "public"."faculty_expertise"
    ADD CONSTRAINT "faculty_expertise_faculty_id_fkey" FOREIGN KEY ("faculty_id")
    REFERENCES "public"."faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── content_versions (append-only) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."content_versions" (
    "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type"    TEXT NOT NULL,
    "entity_id"      TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content_data"   JSONB NOT NULL,
    "created_by_id"  UUID,
    "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "content_versions_entity_type_entity_id_version_number_key"
  ON "public"."content_versions"("entity_type", "entity_id", "version_number");
CREATE INDEX IF NOT EXISTS "content_versions_entity_type_entity_id_version_number_idx"
  ON "public"."content_versions"("entity_type", "entity_id", "version_number" DESC);

DO $$ BEGIN
  ALTER TABLE "public"."content_versions"
    ADD CONSTRAINT "content_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id")
    REFERENCES "public"."cms_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── audit_logs: CMS attribution (additive, nullable) ──────────────────
ALTER TABLE "public"."audit_logs" ADD COLUMN IF NOT EXISTS "cms_user_id" UUID;
ALTER TABLE "public"."audit_logs" ADD COLUMN IF NOT EXISTS "entity_name" TEXT;

CREATE INDEX IF NOT EXISTS "audit_logs_cms_user_id_created_at_idx"
  ON "public"."audit_logs"("cms_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "public"."audit_logs"("created_at" DESC);

DO $$ BEGIN
  ALTER TABLE "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_cms_user_id_fkey" FOREIGN KEY ("cms_user_id")
    REFERENCES "public"."cms_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Row Level Security ────────────────────────────────────────────────
-- Every CMS table is reached ONLY through Prisma using the pooler role.
-- The browser never talks to these tables, so RLS is enabled with NO
-- permissive policies: anon/authenticated get nothing, matching how
-- leads/invoices are already secured.
ALTER TABLE "public"."cms_users"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cms_sessions"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cohort_settings"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."success_stories"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."faculty"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."faculty_expertise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."content_versions"  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "public"."cms_users",
              "public"."cms_sessions",
              "public"."cohort_settings",
              "public"."success_stories",
              "public"."faculty",
              "public"."faculty_expertise",
              "public"."content_versions"
  FROM anon, authenticated;
