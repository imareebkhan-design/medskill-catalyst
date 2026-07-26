-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'COUNSELOR', 'ACCOUNTS', 'VIEWER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DISCOVERY_CALL', 'QUALIFIED', 'LINK_SENT', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('ORGANIC', 'GOOGLE_ADS', 'META_ADS', 'WHATSAPP', 'REFERRAL', 'MANUAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'STATUS_CHANGE', 'EMAIL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CourseMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PLANNED', 'ENROLLING', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('SENT', 'OPENED', 'COMPLETED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PAYMENT_PENDING', 'CONFIRMED', 'ONBOARDING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'DEFERRED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'BANK', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CommStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocKind" AS ENUM ('ID_PROOF', 'CERTIFICATE', 'INVOICE_PDF', 'EXPORT', 'OTHER');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "assigned_to_id" TEXT,
ADD COLUMN     "attribution" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "converted_student_id" TEXT,
ADD COLUMN     "course_interest_id" TEXT,
ADD COLUMN     "lost_reason" TEXT,
ADD COLUMN     "source" "LeadSource" NOT NULL DEFAULT 'ORGANIC',
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "city" TEXT,
    "state" TEXT,
    "qualification" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "body" TEXT NOT NULL,
    "lead_id" BIGINT,
    "student_id" TEXT,
    "enrollment_id" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "base_price_paise" INTEGER NOT NULL,
    "gst_rate_pct" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "hsn_sac" TEXT,
    "duration_weeks" INTEGER,
    "mode" "CourseMode" NOT NULL DEFAULT 'ONLINE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "seat_capacity" INTEGER NOT NULL DEFAULT 20,
    "status" "BatchStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lead_id" BIGINT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "price_paise" INTEGER NOT NULL,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "status" "LinkStatus" NOT NULL DEFAULT 'SENT',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_by_id" TEXT,
    "enrollment_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "price_paise" INTEGER NOT NULL,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "source_lead_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "provider_order_id" TEXT,
    "provider_payment_id" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "method" TEXT,
    "raw_payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "channel" "CommChannel" NOT NULL,
    "to_addr" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "entity_ref" TEXT,
    "provider_message_id" TEXT,
    "status" "CommStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" "DocKind" NOT NULL DEFAULT 'OTHER',
    "r2_key" TEXT NOT NULL,
    "mime" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_clerk_user_id_key" ON "staff_users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_clerk_user_id_key" ON "students"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE INDEX "activities_lead_id_created_at_idx" ON "activities"("lead_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_student_id_created_at_idx" ON "activities"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_enrollment_id_created_at_idx" ON "activities"("enrollment_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "batches_course_id_status_idx" ON "batches"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_links_token_key" ON "enrollment_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_links_enrollment_id_key" ON "enrollment_links"("enrollment_id");

-- CreateIndex
CREATE INDEX "enrollment_links_lead_id_idx" ON "enrollment_links"("lead_id");

-- CreateIndex
CREATE INDEX "enrollment_links_status_expires_at_idx" ON "enrollment_links"("status", "expires_at");

-- CreateIndex
CREATE INDEX "enrollments_batch_id_status_idx" ON "enrollments"("batch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_batch_id_key" ON "enrollments"("student_id", "batch_id");

-- CreateIndex
CREATE INDEX "payment_schedules_status_due_date_idx" ON "payment_schedules"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payment_schedules_enrollment_id_seq_key" ON "payment_schedules"("enrollment_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_payment_id_key" ON "payment_transactions"("provider_payment_id");

-- CreateIndex
CREATE INDEX "payment_transactions_enrollment_id_idx" ON "payment_transactions"("enrollment_id");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_order_id_idx" ON "payment_transactions"("provider_order_id");

-- CreateIndex
CREATE INDEX "communication_logs_entity_ref_idx" ON "communication_logs"("entity_ref");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "communication_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "documents_owner_type_owner_id_idx" ON "documents"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- CreateIndex
CREATE INDEX "leads_status_assigned_to_id_idx" ON "leads"("status", "assigned_to_id");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_course_interest_id_fkey" FOREIGN KEY ("course_interest_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_student_id_fkey" FOREIGN KEY ("converted_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_links" ADD CONSTRAINT "enrollment_links_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_links" ADD CONSTRAINT "enrollment_links_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_links" ADD CONSTRAINT "enrollment_links_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_links" ADD CONSTRAINT "enrollment_links_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_source_lead_id_fkey" FOREIGN KEY ("source_lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "payment_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ── Row Level Security: lock all new tables to service_role only ──
-- (No policies defined: anon/authenticated get nothing via PostgREST;
--  service_role bypasses RLS; Prisma connects as table owner.)
ALTER TABLE "staff_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollment_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communication_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
