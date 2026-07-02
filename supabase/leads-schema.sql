-- MedSkills Catalyst — lead capture table.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to re-run (idempotent).

create table if not exists public.leads (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Core contact
  full_name     text not null,
  email         text not null unique,
  mobile        text,

  -- Segmentation
  form_type     text not null default 'masterclass',  -- masterclass | counseling
  background    text,                                  -- Pharma MR, B.Pharm grad, etc.
  consent       boolean not null default true,

  -- Attribution
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  landing_page  text,

  -- Anything extra the form sends (user_type, company, college, etc.)
  extra         jsonb not null default '{}'::jsonb
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_form_type_idx  on public.leads (form_type);

-- Keep updated_at fresh on re-registration (upsert).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- Lock it down: RLS on, no anon policies.
-- Only the service-role key (used server-side in /api/*) can read/write.
alter table public.leads enable row level security;
