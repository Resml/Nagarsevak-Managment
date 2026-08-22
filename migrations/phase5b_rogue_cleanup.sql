-- migrations/phase5b_rogue_cleanup.sql

-- ==============================================================================
-- PHASE 5B: VULNERABLE INSERT/UPDATE POLICY CLEANUP
-- ==============================================================================
-- Safely drops redundant or insecure policies that bypass Phase 5B isolation.
-- Does NOT touch KEEP policies or ALL policies providing required read access.
-- ==============================================================================

BEGIN;

-- survey_responses
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.survey_responses;

-- ai_history
DROP POLICY IF EXISTS "Allow anon insert access" ON public.ai_history;
DROP POLICY IF EXISTS "Allow anon update access" ON public.ai_history;

-- event_rsvps
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.event_rsvps;

-- events
DROP POLICY IF EXISTS "Allow public insert events" ON public.events;

-- gallery
DROP POLICY IF EXISTS "Allow anon insert access" ON public.gallery;
DROP POLICY IF EXISTS "Allow anon update access" ON public.gallery;

-- improvements
DROP POLICY IF EXISTS "Allow public insert improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow public update improvements" ON public.improvements;

-- incoming_letters
DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow users to update own incoming letters" ON public.incoming_letters;

-- message_logs
DROP POLICY IF EXISTS "tenant_insert" ON public.message_logs;

-- non_voters
DROP POLICY IF EXISTS "Allow public insert non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "Allow public update non_voters" ON public.non_voters;

-- schemes
DROP POLICY IF EXISTS "Allow public insert schemes" ON public.schemes;

-- staff
DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON public.staff;
DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON public.staff;

-- voter_applications
DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable update access for tenant users" ON public.voter_applications;

-- voters
DROP POLICY IF EXISTS "Allow public insert voters" ON public.voters;
DROP POLICY IF EXISTS "Allow public update voters" ON public.voters;

-- ward_provisions
DROP POLICY IF EXISTS "Allow public insert ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow public update ward_provisions" ON public.ward_provisions;

-- work_trackers
DROP POLICY IF EXISTS "Users can insert work trackers for their tenant" ON public.work_trackers;
DROP POLICY IF EXISTS "Users can update work trackers for their tenant" ON public.work_trackers;

-- works
DROP POLICY IF EXISTS "Allow public insert works" ON public.works;

COMMIT;
