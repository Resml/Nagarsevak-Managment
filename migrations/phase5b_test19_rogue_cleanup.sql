-- ==============================================================================
-- MIGRATION: Phase 5B - Test 19 Rogue Policy Cleanup
-- ==============================================================================
-- Description: Drops 4 critical rogue policies on incoming_letters and event_rsvps 
--              that were missing proper cross-tenant isolation boundaries.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_missing_rogue TEXT;
    v_missing_secure TEXT;
BEGIN
    RAISE NOTICE '--- PREFLIGHT CHECK: Checking for presence of 4 rogue policies ---';
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Allow authenticated users to insert incoming letters') THEN
        v_missing_rogue := 'incoming_letters -> Allow authenticated users to insert incoming letters';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incoming_letters' AND policyname = 'Allow users to update own incoming letters') THEN
        v_missing_rogue := 'incoming_letters -> Allow users to update own incoming letters';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Enable insert access for authenticated users') THEN
        v_missing_rogue := 'event_rsvps -> Enable insert access for authenticated users';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Enable update access for authenticated users') THEN
        v_missing_rogue := 'event_rsvps -> Enable update access for authenticated users';
    END IF;

    IF v_missing_rogue IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT FAIL: Expected rogue policy is missing: %', v_missing_rogue;
    END IF;
    RAISE NOTICE 'PREFLIGHT PASS: All 4 rogue policies found.';


    RAISE NOTICE '--- PREFLIGHT CHECK: Checking for presence of secure replacement policies ---';

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
        RAISE EXCEPTION 'PREFLIGHT FAIL: Secure replacement policy is missing! Cannot safely drop rogues: %', v_missing_secure;
    END IF;
    RAISE NOTICE 'PREFLIGHT PASS: All secure replacement policies found.';

END $$;

-- 1. incoming_letters
DROP POLICY IF EXISTS "Allow authenticated users to insert incoming letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Allow users to update own incoming letters"           ON public.incoming_letters;

-- 2. event_rsvps
DROP POLICY IF EXISTS "Enable insert access for authenticated users"         ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable update access for authenticated users"         ON public.event_rsvps;

COMMIT;
