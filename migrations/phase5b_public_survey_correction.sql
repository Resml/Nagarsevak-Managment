-- =============================================================================
-- Phase 5B Correction: Restore Phase 3B Public Survey Intake Dependency
-- =============================================================================
-- This migration safely restores the legitimate anonymous INSERT policy for
-- survey_responses that was inadvertently purged during prior cleanups.
-- It strictly targets only survey_responses and relies on the existing 
-- trg_derive_survey_response_tenant BEFORE INSERT trigger to securely
-- guarantee multi-tenant data boundaries.

BEGIN;

-- Idempotent restoration using the exact Phase 4 definition
DROP POLICY IF EXISTS "Enable insert for public" ON public.survey_responses;
CREATE POLICY "Enable insert for public"
  ON public.survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- Verification Block
-- =============================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    -- 1. Ensure exactly 1 secure public INSERT on survey_responses
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'survey_responses' 
      AND policyname = 'Enable insert for public'
      AND cmd = 'INSERT'
      AND roles::text = '{anon}';

    IF v_count != 1 THEN
        RAISE EXCEPTION 'Verification Failed: Enable insert for public must exist exactly once on survey_responses. Found %', v_count;
    END IF;

    -- 2. Ensure no equivalent policy exists on any other Phase 5B table
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (          
          'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
          'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
          'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
          'sadasya', 'schemes', 'social_organizations', 'surveys',
          'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
          'work_trackers', 'works', 'staff'
      )
      AND policyname = 'Enable insert for public';

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Verification Failed: Found % rogue public INSERT policies on other perimeter tables', v_count;
    END IF;

    RAISE NOTICE 'Phase 5B Correction Verified: Public survey insertion securely restored without perimeter bypasses.';
END;
$$;

COMMIT;
