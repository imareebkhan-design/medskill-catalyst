-- Run this in the Supabase SQL editor.
-- RLS is enabled with no anon INSERT policy; all writes go through
-- the server-side API route using the service-role client.

create table if not exists public.career_applications (
  id                  bigserial primary key,
  application_id      text not null unique,
  created_at          timestamptz not null default now(),
  job_slug            text not null,
  status              text not null default 'New' check (status in ('New', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected')),
  internal_notes      text,
  reviewer            text,

  -- Personal Information
  full_name           text not null,
  email               text not null,
  phone               text not null,
  whatsapp            text not null,
  gender              text,
  dob                 date,
  city                text not null,
  state               text not null,
  country             text not null,
  address             text,

  -- Academic Information
  university          text not null,
  college             text,
  degree              text,
  course              text,
  current_year        text,
  graduation_year     text,
  cgpa                text,

  -- Professional Background
  previous_internship  text,
  leadership_experience text,
  clubs               text,
  volunteer_work      text,
  event_experience    text,

  -- Skills & Online Presence
  skills              text[] not null default '{}'::text[],
  linkedin            text,
  instagram           text,
  portfolio           text,
  github              text,

  -- Short Answer Questions (max 300 words each)
  why_join            text,
  leadership_story    text,
  promotion_plan      text,

  -- Uploads (URLs to files in Supabase Storage)
  resume_url          text not null,
  certificates_url    text,
  portfolio_url       text,
  achievements_url    text,

  -- Attribution & Metadata
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  referrer_url        text,
  device              text,
  browser             text,
  ip_address          text
);

-- Indexes for performance and searchability
create index if not exists career_apps_created_at_idx on public.career_applications (created_at desc);
create index if not exists career_apps_job_slug_idx on public.career_applications (job_slug);
create index if not exists career_apps_status_idx on public.career_applications (status);
create index if not exists career_apps_email_idx on public.career_applications (email);

-- Enable Row Level Security (RLS)
alter table public.career_applications enable row level security;
