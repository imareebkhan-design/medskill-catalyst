-- MedSkills Catalyst — Invoicing (Phase 1 MVP).
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to re-run (idempotent). Depends on: leads-schema.sql (public.leads,
-- public.touch_updated_at). Locked to the service-role key like `leads`.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Invoices
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id              bigserial primary key,
  invoice_no      text not null unique,               -- INV-2026-001 (auto)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Optional link back to the CRM lead this invoice was generated from.
  -- ON DELETE SET NULL: deleting a lead never destroys its invoices.
  lead_id         bigint references public.leads(id) on delete set null,

  -- Bill-to SNAPSHOT — frozen at creation so later lead edits never mutate
  -- an issued invoice. Auto-filled from the lead, editable before saving.
  bill_name       text not null,
  bill_email      text,
  bill_phone      text,
  bill_company    text,
  bill_gstin      text,
  bill_address    text,
  bill_state      text,                               -- e.g. "Uttar Pradesh (Code 09)"

  -- Dates
  issue_date      date not null default current_date,
  due_date        date,

  -- Money (all computed server-side; never trust the client)
  currency        text not null default 'INR',
  tax_rate        numeric(5,2)  not null default 18,   -- GST % applied to subtotal
  subtotal        numeric(12,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,

  -- Workflow
  status          text not null default 'draft'
                  check (status in ('draft','sent','viewed','paid','overdue','cancelled')),
  notes           text,

  -- Seller context (fallbacks live in app/env; stored here for the record)
  seller_gstin    text,
  place_of_supply text
);

create index if not exists invoices_created_at_idx on public.invoices (created_at desc);
create index if not exists invoices_lead_id_idx    on public.invoices (lead_id);
create index if not exists invoices_status_idx      on public.invoices (status);

-- Idempotent column adds — so re-running this file on an existing table is safe.
alter table public.invoices add column if not exists bill_state text;

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
  before update on public.invoices
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Invoice line items
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invoice_items (
  id           bigserial primary key,
  invoice_id   bigint not null references public.invoices(id) on delete cascade,
  position     int not null default 0,               -- display order
  description  text not null,                         -- line 1 = title, rest = subtitle
  hsn          text,                                  -- HSN/SAC code, e.g. 9983
  quantity     numeric(12,2) not null default 1,
  rate         numeric(12,2) not null default 0,
  amount       numeric(12,2) not null default 0      -- quantity * rate (server-set)
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id, position);

-- Idempotent column add for existing installs.
alter table public.invoice_items add column if not exists hsn text;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Atomic invoice numbering → MS/<FY>/<seq:2>  e.g. MS/25-26/01
--    Financial year = Apr–Mar (India). Sequence resets each FY.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.invoice_counters (
  year      int primary key,                          -- FY start year, e.g. 2025
  last_seq  int not null default 0
);

-- Returns the next number and advances the counter in one atomic statement,
-- so two concurrent "Generate Invoice" clicks can never collide.
create or replace function public.next_invoice_no()
returns text
language plpgsql
as $$
declare
  ist timestamp := now() at time zone 'Asia/Kolkata';
  m   int := extract(month from ist)::int;
  yr  int := extract(year  from ist)::int;
  fy  int;                                            -- FY start year
  s   int;
begin
  fy := case when m >= 4 then yr else yr - 1 end;

  insert into public.invoice_counters (year, last_seq)
  values (fy, 1)
  on conflict (year)
  do update set last_seq = public.invoice_counters.last_seq + 1
  returning last_seq into s;

  return 'MS/'
      || lpad((fy % 100)::text, 2, '0') || '-'
      || lpad(((fy + 1) % 100)::text, 2, '0') || '/'
      || lpad(s::text, 2, '0');
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Lock down: RLS on, no anon policies. Only the service-role key
--    (used server-side in /api/invoices) can read/write.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.invoices        enable row level security;
alter table public.invoice_items   enable row level security;
alter table public.invoice_counters enable row level security;
