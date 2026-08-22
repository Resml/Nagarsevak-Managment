-- ==============================================================================
-- MIGRATION: Phase 5B - Test 19 Final Rogue Policy Cleanup
-- ==============================================================================
-- Description: Drops 10 critical rogue policies identified by the final Test 19
--              inventory that completely bypass cross-tenant isolation boundaries.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    v_missing_secure TEXT;
BEGIN
    RAISE NOTICE '--- PREFLIGHT CHECK: Checking for presence of secure replacement policies ---';

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
        RAISE EXCEPTION 'PREFLIGHT FAIL: Secure replacement policy is missing! Cannot safely drop rogues: %', v_missing_secure;
    END IF;
    
    RAISE NOTICE 'PREFLIGHT PASS: All secure replacement policies found on all 5 tables.';

END $$;

-- 1. gb_diary
DROP POLICY IF EXISTS "Allow all for everyone_ins" ON public.gb_diary;
DROP POLICY IF EXISTS "Allow all for everyone_upd" ON public.gb_diary;

-- 2. housing_societies
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_ins" ON public.housing_societies;
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societ_upd" ON public.housing_societies;

-- 3. social_organizations
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_ins" ON public.social_organizations;
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organiz_upd" ON public.social_organizations;

-- 4. surveys
DROP POLICY IF EXISTS "Enable all access for authenticated users_ins" ON public.surveys;
DROP POLICY IF EXISTS "Enable all access for authenticated users_upd" ON public.surveys;

-- 5. visitors
DROP POLICY IF EXISTS "Public Access Visitors_ins" ON public.visitors;
DROP POLICY IF EXISTS "Public Access Visitors_upd" ON public.visitors;

COMMIT;
