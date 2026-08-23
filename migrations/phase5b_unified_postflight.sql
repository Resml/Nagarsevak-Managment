-- ============================================================
-- phase5b_unified_postflight.sql
-- Run AFTER phase5b_unified_migration.sql commits successfully.
-- Verifies the exact expected state using confirmed live policy names.
-- Each section is independent with explicit [PASS]/[FAIL] output.
-- ============================================================

DO $$
DECLARE
    v_count  INT;
    v_wcheck TEXT;
    v_qual   TEXT;
BEGIN

    -- ========================================================
    -- SECTION 1: letter_requests
    -- ========================================================

    -- 1a. All dropped policies must be gone
    SELECT COUNT(*) INTO v_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_requests'
      AND policyname IN (
          'Auth Letter Select',
          'Auth Letter Insert',
          'Auth Letter Update',
          'Auth Letter Delete',
          'Tenant Isolation Select',
          'Tenant Isolation Insert',
          'Tenant Isolation Update',
          'Tenant Isolation Delete',
          'Public Access Letters_ins',
          'Public Access Letters_upd'
      );
    IF v_count > 0 THEN
        RAISE EXCEPTION '[FAIL] letter_requests: % dropped policy(ies) still exist.', v_count;
    END IF;
    RAISE NOTICE '[PASS] letter_requests: all legacy/bypass policies are gone.';

    -- 1b. Unified Letter Insert: exists and contains all 3 conditions
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_requests'
      AND policyname = 'Unified Letter Insert' AND cmd = 'INSERT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_requests: "Unified Letter Insert" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Insert": missing get_authorized_tenants check.';
    END IF;
    IF v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Insert": missing has_member_feature_access check.';
    END IF;
    IF v_wcheck NOT ILIKE '%voter_id IS NULL%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Insert": missing FK spoofing protection (voter_id IS NULL).';
    END IF;
    RAISE NOTICE '[PASS] letter_requests: "Unified Letter Insert" exists with all 3 conditions.';

    -- 1c. Unified Letter Update: exists and contains all 3 conditions
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_requests'
      AND policyname = 'Unified Letter Update' AND cmd = 'UPDATE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_requests: "Unified Letter Update" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%'
    OR v_wcheck NOT ILIKE '%has_member_feature_access%'
    OR v_wcheck NOT ILIKE '%voter_id IS NULL%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Update": missing one or more security conditions.';
    END IF;
    RAISE NOTICE '[PASS] letter_requests: "Unified Letter Update" exists with all 3 conditions.';

    -- 1d. Unified Letter Select/Delete: exists and enforce feature access
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_requests'
      AND policyname = 'Unified Letter Select' AND cmd = 'SELECT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_requests: "Unified Letter Select" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Select": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] letter_requests: Unified Letter Select exists with feature access.';


    -- ========================================================
    -- SECTION 2: sadasya
    -- ========================================================

    -- 2a. All dropped policies must be gone
    SELECT COUNT(*) INTO v_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sadasya'
      AND policyname IN (
          'Auth Sadasya Select',
          'Auth Sadasya Insert',
          'Auth Sadasya Update',
          'Auth Sadasya Delete',
          'Tenant Isolation Select',
          'Tenant Isolation Insert',
          'Tenant Isolation Update',
          'Tenant Isolation Delete',
          'Enable all access for authenticated users_ins',
          'Enable all access for authenticated users_upd',
          'Enable read access for all users of same tenant'
      );
    IF v_count > 0 THEN
        RAISE EXCEPTION '[FAIL] sadasya: % dropped policy(ies) still exist.', v_count;
    END IF;
    RAISE NOTICE '[PASS] sadasya: all legacy/bypass policies are gone.';

    -- 2b. Unified Sadasya Insert: exists and contains all 3 conditions
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sadasya'
      AND policyname = 'Unified Sadasya Insert' AND cmd = 'INSERT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] sadasya: "Unified Sadasya Insert" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Sadasya Insert": missing get_authorized_tenants check.';
    END IF;
    IF v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Sadasya Insert": missing has_member_feature_access check.';
    END IF;
    IF v_wcheck NOT ILIKE '%linked_voter_id IS NULL%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Sadasya Insert": missing FK spoofing protection.';
    END IF;
    RAISE NOTICE '[PASS] sadasya: "Unified Sadasya Insert" exists with all 3 conditions.';

    -- 2c. Unified Sadasya Update: exists and contains all 3 conditions
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sadasya'
      AND policyname = 'Unified Sadasya Update' AND cmd = 'UPDATE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] sadasya: "Unified Sadasya Update" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%'
    OR v_wcheck NOT ILIKE '%has_member_feature_access%'
    OR v_wcheck NOT ILIKE '%linked_voter_id IS NULL%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Sadasya Update": missing one or more security conditions.';
    END IF;
    RAISE NOTICE '[PASS] sadasya: "Unified Sadasya Update" exists with all 3 conditions.';

    -- 2d. Unified Sadasya Select/Delete: exists and enforce feature access
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sadasya'
      AND policyname = 'Unified Sadasya Select' AND cmd = 'SELECT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] sadasya: "Unified Sadasya Select" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Sadasya Select": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] sadasya: Unified Sadasya Select exists with feature access.';


    -- ========================================================
    -- SECTION 3: letter_types
    -- ========================================================

    -- 3a. All dropped policies must be gone
    SELECT COUNT(*) INTO v_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_types'
      AND policyname IN (
          'Tenant Select letter_types',
          'Tenant Delete letter_types',
          'Tenant Isolation Select',
          'Tenant Isolation Delete',
          'Tenant Isolation Insert',
          'Tenant Isolation Update',
          'Public Access Letter Types_ins',
          'Public Access Letter Types_upd',
          'letter_types_tenant_isolation_ins',
          'letter_types_tenant_isolation_upd'
      );
    IF v_count > 0 THEN
        RAISE EXCEPTION '[FAIL] letter_types: % dropped policy(ies) still exist.', v_count;
    END IF;
    RAISE NOTICE '[PASS] letter_types: all legacy/bypass policies are gone.';

    -- 3b. Unified Letter Types Select: exists and enforce feature access
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_types'
      AND policyname = 'Unified Letter Types Select' AND cmd = 'SELECT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_types: "Unified Letter Types Select" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Types Select": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] letter_types: Unified Letter Types Select exists with feature access.';

    -- 3c. Unified Letter Types Delete: exists and enforce feature access
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_types'
      AND policyname = 'Unified Letter Types Delete' AND cmd = 'DELETE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_types: "Unified Letter Types Delete" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Types Delete": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] letter_types: Unified Letter Types Delete exists with feature access.';

    -- 3d. Unified Letter Types Insert: exists and enforce feature access
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_types'
      AND policyname = 'Unified Letter Types Insert' AND cmd = 'INSERT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_types: "Unified Letter Types Insert" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' OR v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Types Insert": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] letter_types: Unified Letter Types Insert exists with feature access.';

    -- 3e. Unified Letter Types Update: exists and enforce feature access
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'letter_types'
      AND policyname = 'Unified Letter Types Update' AND cmd = 'UPDATE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] letter_types: "Unified Letter Types Update" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' OR v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Letter Types Update": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] letter_types: Unified Letter Types Update exists with feature access.';


    -- ========================================================
    -- SECTION 4: personal_requests
    -- ========================================================

    -- 4a. All dropped policies must be gone
    SELECT COUNT(*) INTO v_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_requests'
      AND policyname IN (
          'Tenant Select personal_requests',
          'Tenant Delete personal_requests',
          'Tenant Isolation Select',
          'Tenant Isolation Delete',
          'Tenant Isolation Insert',
          'Tenant Isolation Update',
          'personal_requests_tenant_isolation_ins',
          'personal_requests_tenant_isolation_upd'
      );
    IF v_count > 0 THEN
        RAISE EXCEPTION '[FAIL] personal_requests: % dropped policy(ies) still exist.', v_count;
    END IF;
    RAISE NOTICE '[PASS] personal_requests: all legacy/bypass policies are gone.';

    -- 4b. Unified Personal Requests Select: exists and enforce feature access (complaints)
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_requests'
      AND policyname = 'Unified Personal Requests Select' AND cmd = 'SELECT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] personal_requests: "Unified Personal Requests Select" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Personal Requests Select": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] personal_requests: Unified Personal Requests Select exists with feature access.';

    -- 4c. Unified Personal Requests Delete: exists and enforce feature access (complaints)
    SELECT qual INTO v_qual FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_requests'
      AND policyname = 'Unified Personal Requests Delete' AND cmd = 'DELETE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] personal_requests: "Unified Personal Requests Delete" is missing.';
    END IF;
    IF v_qual NOT ILIKE '%get_authorized_tenants%' OR v_qual NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Personal Requests Delete": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] personal_requests: Unified Personal Requests Delete exists with feature access.';

    -- 4d. Unified Personal Requests Insert: exists and enforce feature access (complaints)
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_requests'
      AND policyname = 'Unified Personal Requests Insert' AND cmd = 'INSERT';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] personal_requests: "Unified Personal Requests Insert" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' OR v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Personal Requests Insert": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] personal_requests: Unified Personal Requests Insert exists with feature access.';

    -- 4e. Unified Personal Requests Update: exists and enforce feature access (complaints)
    SELECT with_check INTO v_wcheck FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_requests'
      AND policyname = 'Unified Personal Requests Update' AND cmd = 'UPDATE';
    IF NOT FOUND THEN
        RAISE EXCEPTION '[FAIL] personal_requests: "Unified Personal Requests Update" is missing.';
    END IF;
    IF v_wcheck NOT ILIKE '%get_authorized_tenants%' OR v_wcheck NOT ILIKE '%has_member_feature_access%' THEN
        RAISE EXCEPTION '[FAIL] "Unified Personal Requests Update": missing required checks.';
    END IF;
    RAISE NOTICE '[PASS] personal_requests: Unified Personal Requests Update exists with feature access.';


    -- ========================================================
    -- FINAL
    -- ========================================================
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'POSTFLIGHT COMPLETE: All 4 sections PASSED.';
    RAISE NOTICE '============================================================';
END;
$$;
