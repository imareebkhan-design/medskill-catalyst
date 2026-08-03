-- Razorpay fulfillment: link invoices to enrollments (idempotency guard) and
-- track post-payment email fulfillment separately from payment status.
-- Additive + idempotent; safe to re-run.

ALTER TABLE "public"."invoices"
  ADD COLUMN IF NOT EXISTS "enrollment_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_enrollment_id_key"
  ON "public"."invoices"("enrollment_id");

ALTER TABLE "public"."enrollments"
  ADD COLUMN IF NOT EXISTS "welcome_email_sent_at" TIMESTAMPTZ(6);
