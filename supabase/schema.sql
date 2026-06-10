-- Run this in the Supabase SQL editor (or as a migration).
-- RLS is ON with no anon INSERT policy by design.
-- All writes go through the server-side /api/register route using the service-role key.

create table if not exists public.webinar_registrations (
  id                  bigserial primary key,
  created_at          timestamptz not null default now(),

  -- Core contact
  full_name           text        not null,
  mobile              text        not null,
  email               text        not null unique,

  -- Segment
  user_type           text        not null check (user_type in ('student', 'professional')),

  -- Student fields
  college_name        text,
  course              text,
  graduation_year     smallint,

  -- Professional fields
  company_name        text,
  job_title           text,
  experience          text        check (experience in ('0-1', '1-3', '3-5', '5+')),

  -- Attribution
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  ambassador_id       text,
  college_id          text,
  registration_source text,
  referrer_url        text,
  landing_path        text
);

-- Enable RLS — no anon policy means only the service-role key can write.
alter table public.webinar_registrations enable row level security;

-- Optional read-only view for the dashboard (service role can always bypass RLS).
create or replace view public.webinar_registrations_summary as
  select
    date_trunc('day', created_at) as day,
    user_type,
    registration_source,
    count(*)                       as registrations
  from public.webinar_registrations
  group by 1, 2, 3
  order by 1 desc;
