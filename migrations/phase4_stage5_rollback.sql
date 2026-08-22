-- Phase 4 Stage 5 Rollback: Re-add Legacy Proxy Columns
-- 
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- IMPORTANT WARNING: 
-- Dropping columns is a destructive operation. While this rollback script will recreate 
-- the 'plan' and 'category' columns as standard text fields, any data previously stored 
-- in those columns was PERMANENTLY DESTROYED by the DROP operation. 
-- 
-- The proxy previously injected strings like 'ADVANCE' into these columns.
-- Re-running this rollback will NOT restore those values. You must restore from a 
-- database backup if you require the historical data for 'plan' and 'category'.
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

BEGIN;

-- 1. Restore 'plan' to all 28 target tables
ALTER TABLE public.ai_history ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.election_results ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.gb_diary ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.housing_societies ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.improvements ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.incoming_letters ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.letter_types ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.non_voters ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.personal_requests ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.sadasya ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.social_organizations ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.voter_applications ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.ward_provisions ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.work_trackers ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS plan text;

-- 2. Restore 'category' to the 22 tables that had it dropped
ALTER TABLE public.ai_history ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.election_results ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.gb_diary ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.housing_societies ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.improvements ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.incoming_letters ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.letter_types ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.non_voters ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.sadasya ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.social_organizations ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.survey_responses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.voter_applications ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.work_trackers ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS category text;

COMMIT;
