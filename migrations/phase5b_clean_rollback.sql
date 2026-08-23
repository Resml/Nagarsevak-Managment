-- =============================================================================
-- Phase 5B -- CLEAN ROLLBACK
-- File: phase5b_clean_rollback.sql
--
-- PURPOSE:
--   A purely destructive rollback that only drops Phase 5B policies, functions,
--   and triggers. Because Phase 5B failed to drop the original Phase 4 policies,
--   dropping these overriding policies instantly restores the database to the 
--   known-good Phase 4 state.
--
-- EXECUTION: Manual (Run in Supabase SQL Editor)
-- =============================================================================

BEGIN;

-- 1. Drop Phase 5B Triggers
DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;

-- 2. Drop 112 Phase 5B Policies
-- Table: ai_history
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.ai_history;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.ai_history;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.ai_history;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.ai_history;

-- Table: complaints
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.complaints;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.complaints;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.complaints;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.complaints;

-- Table: election_results
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.election_results;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.election_results;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.election_results;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.election_results;

-- Table: event_rsvps
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.event_rsvps;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.event_rsvps;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.event_rsvps;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.event_rsvps;

-- Table: events
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.events;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.events;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.events;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.events;

-- Table: gallery
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.gallery;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.gallery;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.gallery;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.gallery;

-- Table: gb_diary
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.gb_diary;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.gb_diary;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.gb_diary;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.gb_diary;

-- Table: housing_societies
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.housing_societies;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.housing_societies;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.housing_societies;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.housing_societies;

-- Table: improvements
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.improvements;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.improvements;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.improvements;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.improvements;

-- Table: incoming_letters
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.incoming_letters;

-- Table: letter_requests
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.letter_requests;

-- Table: letter_types
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.letter_types;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.letter_types;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.letter_types;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.letter_types;

-- Table: message_logs
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.message_logs;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.message_logs;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.message_logs;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.message_logs;

-- Table: non_voters
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.non_voters;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.non_voters;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.non_voters;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.non_voters;

-- Table: personal_requests
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.personal_requests;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.personal_requests;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.personal_requests;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.personal_requests;

-- Table: sadasya
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.sadasya;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.sadasya;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.sadasya;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.sadasya;

-- Table: schemes
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.schemes;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.schemes;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.schemes;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.schemes;

-- Table: social_organizations
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.social_organizations;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.social_organizations;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.social_organizations;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.social_organizations;

-- Table: survey_responses
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.survey_responses;

-- Table: surveys
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.surveys;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.surveys;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.surveys;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.surveys;

-- Table: tasks
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.tasks;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.tasks;

-- Table: visitors
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.visitors;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.visitors;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.visitors;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.visitors;

-- Table: voter_applications
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.voter_applications;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.voter_applications;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.voter_applications;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.voter_applications;

-- Table: voters
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.voters;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.voters;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.voters;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.voters;

-- Table: ward_provisions
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.ward_provisions;

-- Table: work_trackers
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.work_trackers;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.work_trackers;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.work_trackers;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.work_trackers;

-- Table: works
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.works;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.works;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.works;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.works;

-- Table: staff
DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.staff;
DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.staff;
DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.staff;
DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.staff;

-- 3. Drop Phase 5B Functions using exact signatures
DROP FUNCTION IF EXISTS public.validate_staff_permissions_entitlement();
DROP FUNCTION IF EXISTS public.prevent_staff_permission_escalation();
DROP FUNCTION IF EXISTS public.has_member_feature_access(UUID, UUID, TEXT);

COMMIT;
