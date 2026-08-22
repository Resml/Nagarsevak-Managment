-- migrations/phase5b_rogue_postflight.sql

-- ==============================================================================
-- PHASE 5B: VULNERABLE INSERT/UPDATE POLICY POSTFLIGHT
-- ==============================================================================
-- This query confirms that the 27 vulnerable policies have been successfully dropped
-- and that the required KEEP policies are still fully intact.
-- ==============================================================================

DO $$
DECLARE
    v_dropped_count INT;
    v_keep_count INT;
BEGIN
    -- 1. Check that the 27 dropped policies are GONE
    SELECT COUNT(*) INTO v_dropped_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (tablename = 'survey_responses' AND policyname = 'Enable insert for authenticated users') OR
        (tablename = 'ai_history' AND policyname IN ('Allow anon insert access', 'Allow anon update access')) OR
        (tablename = 'event_rsvps' AND policyname IN ('Enable insert access for authenticated users', 'Enable update access for authenticated users')) OR
        (tablename = 'events' AND policyname = 'Allow public insert events') OR
        (tablename = 'gallery' AND policyname IN ('Allow anon insert access', 'Allow anon update access')) OR
        (tablename = 'improvements' AND policyname IN ('Allow public insert improvements', 'Allow public update improvements')) OR
        (tablename = 'incoming_letters' AND policyname IN ('Allow authenticated users to insert incoming letters', 'Allow users to update own incoming letters')) OR
        (tablename = 'message_logs' AND policyname = 'tenant_insert') OR
        (tablename = 'non_voters' AND policyname IN ('Allow public insert non_voters', 'Allow public update non_voters')) OR
        (tablename = 'schemes' AND policyname = 'Allow public insert schemes') OR
        (tablename = 'staff' AND policyname IN ('Tenant Isolation Insert Staff', 'Tenant Isolation Update Staff')) OR
        (tablename = 'voter_applications' AND policyname IN ('Enable insert access for tenant users', 'Enable update access for tenant users')) OR
        (tablename = 'voters' AND policyname IN ('Allow public insert voters', 'Allow public update voters')) OR
        (tablename = 'ward_provisions' AND policyname IN ('Allow public insert ward_provisions', 'Allow public update ward_provisions')) OR
        (tablename = 'work_trackers' AND policyname IN ('Users can insert work trackers for their tenant', 'Users can update work trackers for their tenant')) OR
        (tablename = 'works' AND policyname = 'Allow public insert works')
    );

    IF v_dropped_count > 0 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: % vulnerable policies still exist.', v_dropped_count;
    ELSE
        RAISE NOTICE 'POSTFLIGHT SUCCESS: All 27 vulnerable policies successfully dropped.';
    END IF;

    -- 2. Check that the critical KEEP policies remain intact
    SELECT COUNT(*) INTO v_keep_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (tablename = 'election_results' AND policyname IN ('Admin Insert election_results', 'Admin Update election_results')) OR
        (tablename = 'event_rsvps' AND policyname IN ('Anon Event RSVP', 'Auth RSVP Insert', 'Auth RSVP Update')) OR
        (tablename = 'survey_responses' AND policyname IN ('Anon Survey Insert', 'Auth Survey Insert', 'Auth Survey Update', 'Enable insert for public')) OR
        (tablename = 'message_logs' AND policyname = 'service_role_all')
    );

    -- We expect exactly 10 KEEP policies here
    IF v_keep_count < 10 THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Missing required KEEP policies. Expected 10, found %.', v_keep_count;
    ELSE
        RAISE NOTICE 'POSTFLIGHT SUCCESS: All required KEEP policies are fully intact.';
    END IF;
END $$;
