-- Phase 4 Stage 5: Drop Legacy Proxy Columns
-- This migration drops the redundant 'plan' and 'category' columns injected by the legacy proxy.
-- Domain-specific 'category' fields are explicitly PRESERVED to avoid data loss.

BEGIN;

-- 1. Tables where BOTH plan and category are dropped (No domain category)
ALTER TABLE public.ai_history DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.election_results DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.event_rsvps DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.events DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.gb_diary DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.housing_societies DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.improvements DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.incoming_letters DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.letter_requests DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.letter_types DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.message_logs DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.non_voters DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.sadasya DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.social_organizations DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.survey_responses DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.surveys DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.visitors DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.voter_applications DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.voters DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.work_trackers DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;
ALTER TABLE public.works DROP COLUMN IF EXISTS plan, DROP COLUMN IF EXISTS category;

-- 2. Tables where ONLY plan is dropped (Domain category is preserved)
ALTER TABLE public.complaints DROP COLUMN IF EXISTS plan;
ALTER TABLE public.gallery DROP COLUMN IF EXISTS plan;
ALTER TABLE public.personal_requests DROP COLUMN IF EXISTS plan;
ALTER TABLE public.schemes DROP COLUMN IF EXISTS plan;
ALTER TABLE public.staff DROP COLUMN IF EXISTS plan;
ALTER TABLE public.ward_provisions DROP COLUMN IF EXISTS plan;

COMMIT;
