-- ==============================================================================
-- POSTFLIGHT: Phase 5B - Test 19 Rogue Policy Cleanup
-- ==============================================================================
-- Description: Verifies the 4 rogue policies are successfully dropped and the 
--              secure replacements are still intact.
-- ==============================================================================

DO $$
DECLARE
    v_found TEXT;
    v_missing_secure TEXT;
BEGIN
    RAISE NOTICE '--- POSTFLIGHT: Verifying rogue policies are dropped ---';
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Allow authenticated users to insert incoming letters') THEN
        v_found := 'incoming_letters -> Allow authenticated users to insert incoming letters';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Allow users to update own incoming letters') THEN
        v_found := 'incoming_letters -> Allow users to update own incoming letters';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Enable insert access for authenticated users') THEN
        v_found := 'event_rsvps -> Enable insert access for authenticated users';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Enable update access for authenticated users') THEN
        v_found := 'event_rsvps -> Enable update access for authenticated users';
    END IF;

    IF v_found IS NOT NULL THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Rogue policy was NOT dropped: %', v_found;
    END IF;
    RAISE NOTICE 'POSTFLIGHT PASS: All 4 rogue policies successfully dropped.';


    RAISE NOTICE '--- POSTFLIGHT: Verifying secure replacement policies remain intact ---';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'incoming_letters -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'incoming_letters -> Tenant Isolation Update';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'event_rsvps -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'event_rsvps -> Tenant Isolation Update';
    END IF;

    IF v_missing_secure IS NOT NULL THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Secure replacement policy was accidentally dropped! %', v_missing_secure;
    END IF;
    RAISE NOTICE 'POSTFLIGHT PASS: All secure replacement policies are intact.';

END $$;
