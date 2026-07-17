-- MedSkills Catalyst — separate Live Q&A registrations from Masterclass leads.
--
-- Why: /api/qa-register used to write form_type = 'masterclass', identical to the
-- homepage form, so Q&A signups were counted inside the Masterclass tile and could
-- not be isolated. It also nested utm_*/landing_page inside `extra`, while the
-- dashboard and CSV exports read those as top-level columns — so attribution came
-- out blank for every Q&A lead.
--
-- The endpoint now writes form_type = 'qa_session' with attribution at top level.
-- This backfill applies the same correction to rows already collected, identifying
-- them by the marker the old code did store: extra->>'source' = 'Q&A Registration'.
--
-- Paste into Supabase > SQL Editor > New query > Run. Safe to re-run (idempotent).
-- Non-destructive: `extra` is left untouched; values are copied up, never moved.

-- 1) Look before you leap — how many rows will change?
select count(*) as rows_to_backfill
from public.leads
where extra->>'source' = 'Q&A Registration'
  and form_type <> 'qa_session';

-- 2) The backfill itself.
update public.leads
set
  form_type    = 'qa_session',
  -- Prefer an existing top-level value; fall back to whatever `extra` carried.
  utm_source   = coalesce(nullif(utm_source, ''),   extra->>'utm_source'),
  utm_medium   = coalesce(nullif(utm_medium, ''),   extra->>'utm_medium'),
  utm_campaign = coalesce(nullif(utm_campaign, ''), extra->>'utm_campaign'),
  landing_page = coalesce(nullif(landing_page, ''), extra->>'landing_page', '/qnaregistration')
where extra->>'source' = 'Q&A Registration'
  and form_type <> 'qa_session';

-- 3) Verify: Q&A rows should now be their own bucket, with landing_page populated.
select
  form_type,
  count(*)                                            as leads,
  count(*) filter (where coalesce(landing_page,'') <> '') as with_landing_page,
  min(created_at)                                     as first_seen,
  max(created_at)                                     as last_seen
from public.leads
group by form_type
order by leads desc;
