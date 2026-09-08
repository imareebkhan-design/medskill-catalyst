-- CMS login rate limiting (Phase 3.1).
-- Additive and idempotent: one new table, no changes to anything existing.
-- Kept separate from 20260907120000_cms_v1 so that reviewed migration stays
-- byte-identical; both apply together on the next `prisma migrate deploy`.

CREATE TABLE IF NOT EXISTS "public"."cms_login_attempts" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "ip"         TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cms_login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cms_login_attempts_identifier_created_at_idx"
  ON "public"."cms_login_attempts"("identifier", "created_at");
CREATE INDEX IF NOT EXISTS "cms_login_attempts_ip_created_at_idx"
  ON "public"."cms_login_attempts"("ip", "created_at");

-- Reached only through Prisma on the pooler role; the browser never sees it.
ALTER TABLE "public"."cms_login_attempts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "public"."cms_login_attempts" FROM anon, authenticated;
