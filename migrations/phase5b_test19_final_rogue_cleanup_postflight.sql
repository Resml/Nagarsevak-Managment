-- ==============================================================================
-- POSTFLIGHT: Phase 5B - Test 19 Final Rogue Policy Cleanup
-- ==============================================================================
-- Description: Verifies the 10 rogue policies are successfully dropped and the 
--              secure replacements are still intact.
-- ==============================================================================

DO $$
DECLARE
    v_found TEXT;
    v_missing_secure TEXT;
BEGIN
    RAISE NOTICE '--- POSTFLIGHT: Verifying rogue policies are dropped ---';
    
    -- gb_diary
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gb_diary' AND policyname = 'Allow all for everyone_ins') THEN
        v_found := 'gb_diary -> Allow all for everyone_ins';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gb_diary' AND policyname = 'Allow all for everyone_upd') THEN
        v_found := 'gb_diary -> Allow all for everyone_upd';
        
    -- housing_societies
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'housing_societies' AND policyname = 'Enable all access for authenticated users on housing_societ_ins') THEN
        v_found := 'housing_societies -> Enable all access for authenticated users on housing_societ_ins';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'housing_societies' AND policyname = 'Enable all access for authenticated users on housing_societ_upd') THEN
        v_found := 'housing_societies -> Enable all access for authenticated users on housing_societ_upd';
        
    -- social_organizations
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_organizations' AND policyname = 'Enable all access for authenticated users on social_organiz_ins') THEN
        v_found := 'social_organizations -> Enable all access for authenticated users on social_organiz_ins';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_organizations' AND policyname = 'Enable all access for authenticated users on social_organiz_upd') THEN
        v_found := 'social_organizations -> Enable all access for authenticated users on social_organiz_upd';
        
    -- surveys
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Enable all access for authenticated users_ins') THEN
        v_found := 'surveys -> Enable all access for authenticated users_ins';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Enable all access for authenticated users_upd') THEN
        v_found := 'surveys -> Enable all access for authenticated users_upd';
        
    -- visitors
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitors' AND policyname = 'Public Access Visitors_ins') THEN
        v_found := 'visitors -> Public Access Visitors_ins';
    ELSIF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitors' AND policyname = 'Public Access Visitors_upd') THEN
        v_found := 'visitors -> Public Access Visitors_upd';
    END IF;

    IF v_found IS NOT NULL THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Rogue policy was NOT dropped: %', v_found;
    END IF;
    RAISE NOTICE 'POSTFLIGHT PASS: All 10 rogue policies successfully dropped.';


    RAISE NOTICE '--- POSTFLIGHT: Verifying secure replacement policies remain intact ---';

    -- gb_diary
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gb_diary' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'gb_diary -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gb_diary' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'gb_diary -> Tenant Isolation Update';
        
    -- housing_societies
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'housing_societies' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'housing_societies -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'housing_societies' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'housing_societies -> Tenant Isolation Update';
        
    -- social_organizations
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_organizations' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'social_organizations -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_organizations' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'social_organizations -> Tenant Isolation Update';
        
    -- surveys
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'surveys -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'surveys -> Tenant Isolation Update';
        
    -- visitors
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitors' AND policyname = 'Tenant Isolation Insert') THEN
        v_missing_secure := 'visitors -> Tenant Isolation Insert';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitors' AND policyname = 'Tenant Isolation Update') THEN
        v_missing_secure := 'visitors -> Tenant Isolation Update';
    END IF;

    IF v_missing_secure IS NOT NULL THEN
        RAISE EXCEPTION 'POSTFLIGHT FAIL: Secure replacement policy was accidentally dropped! %', v_missing_secure;
    END IF;
    RAISE NOTICE 'POSTFLIGHT PASS: All secure replacement policies are intact.';

END $$;
