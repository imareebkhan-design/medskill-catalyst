-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."career_applications" (
    "id" BIGSERIAL NOT NULL,
    "application_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "job_slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "internal_notes" TEXT,
    "reviewer" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "gender" TEXT,
    "dob" DATE,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address" TEXT,
    "university" TEXT NOT NULL,
    "college" TEXT,
    "degree" TEXT,
    "course" TEXT,
    "current_year" TEXT,
    "graduation_year" TEXT,
    "cgpa" TEXT,
    "previous_internship" TEXT,
    "leadership_experience" TEXT,
    "clubs" TEXT,
    "volunteer_work" TEXT,
    "event_experience" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedin" TEXT,
    "instagram" TEXT,
    "portfolio" TEXT,
    "github" TEXT,
    "why_join" TEXT,
    "leadership_story" TEXT,
    "promotion_plan" TEXT,
    "resume_url" TEXT NOT NULL,
    "certificates_url" TEXT,
    "portfolio_url" TEXT,
    "achievements_url" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "referrer_url" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_counters" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "public"."invoice_items" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hsn" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" BIGSERIAL NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lead_id" BIGINT,
    "bill_name" TEXT NOT NULL,
    "bill_email" TEXT,
    "bill_phone" TEXT,
    "bill_company" TEXT,
    "bill_gstin" TEXT,
    "bill_address" TEXT,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "due_date" DATE,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "seller_gstin" TEXT,
    "place_of_supply" TEXT,
    "bill_state" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "form_type" TEXT NOT NULL DEFAULT 'masterclass',
    "background" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "landing_page" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_applications_application_id_key" ON "public"."career_applications"("application_id" ASC);

-- CreateIndex
CREATE INDEX "career_apps_created_at_idx" ON "public"."career_applications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "career_apps_email_idx" ON "public"."career_applications"("email" ASC);

-- CreateIndex
CREATE INDEX "career_apps_job_slug_idx" ON "public"."career_applications"("job_slug" ASC);

-- CreateIndex
CREATE INDEX "career_apps_status_idx" ON "public"."career_applications"("status" ASC);

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "public"."invoice_items"("invoice_id" ASC, "position" ASC);

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "public"."invoices"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "public"."invoices"("invoice_no" ASC);

-- CreateIndex
CREATE INDEX "invoices_lead_id_idx" ON "public"."invoices"("lead_id" ASC);

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status" ASC);

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "public"."leads"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "public"."leads"("email" ASC);

-- CreateIndex
CREATE INDEX "leads_form_type_idx" ON "public"."leads"("form_type" ASC);

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

