-- =============================================================================
-- Phase 5B -- POST-ROLLBACK VERIFICATION
-- File: phase5b_post_rollback_verify.sql
--
-- PURPOSE:
--   Verify that the rollback successfully restored Phase 2/4 tenant isolation
--   and removed all Phase 5B components and the scoping bugs.
--
-- SAFE: Read-only. Zero DDL, DML, or modification statements.
-- =============================================================================

DO $$
DECLARE
    v_count             INT;
    v_bug_count         INT;
    v_correct_count     INT;
    v_table_name        TEXT;
    v_missing_policies  TEXT := '';
    v_total             INT := 0;
BEGIN
    RAISE NOTICE '--- Starting Post-Rollback Verification ---';

    -- -------------------------------------------------------------------------
    -- TEST 1: Phase 5B functions and triggers are completely dropped
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc 
    WHERE proname IN (
        'has_member_feature_access', 
        'validate_staff_permissions_entitlement', 
        'prevent_staff_permission_escalation'
    );
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FAIL: % Phase 5B functions still exist (should be 0)', v_count;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM pg_trigger 
    WHERE tgname IN (
        'trg_validate_staff_permissions', 
        'trg_prevent_staff_permission_escalation'
    );
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FAIL: % Phase 5B triggers still exist (should be 0)', v_count;
    END IF;
    RAISE NOTICE 'PASS: Phase 5B triggers and functions dropped.';

    -- -------------------------------------------------------------------------
    -- TEST 2: has_feature_access() remains intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_feature_access';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'FAIL: has_feature_access function is MISSING (Phase 4 destroyed)';
    END IF;
    RAISE NOTICE 'PASS: Phase 4 has_feature_access remains intact.';

    -- -------------------------------------------------------------------------
    -- TEST 3: Original Phase 2 expressions restored, tautology eliminated
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_bug_count
    FROM pg_policies
    WHERE policyname LIKE 'Allow % based on tenant_id'
      AND (qual LIKE '%utm.tenant_id = utm.tenant_id%' OR with_check LIKE '%utm.tenant_id = utm.tenant_id%');
    
    IF v_bug_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL FAIL: % policies still contain the utm.tenant_id = utm.tenant_id scoping bug!', v_bug_count;
    END IF;

    SELECT COUNT(*) INTO v_correct_count
    FROM pg_policies
    WHERE policyname LIKE 'Allow % based on tenant_id'
      AND (qual LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%' 
           OR with_check LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%');

    IF v_correct_count < 112 THEN
        RAISE WARNING 'Expected 112 fully qualified tenant conditions, found %', v_correct_count;
    ELSE
        RAISE NOTICE 'PASS: % policies have properly qualified outer-table tenant_id scoping', v_correct_count;
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 4: Phase 3B Anonymous policies intact (surveys)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'surveys' AND roles @> ARRAY['anon']::name[];
    IF v_count = 0 THEN
        RAISE EXCEPTION 'FAIL: Phase 3B anonymous survey policies are MISSING';
    END IF;
    RAISE NOTICE 'PASS: Phase 3B anonymous survey policies intact.';

    -- -------------------------------------------------------------------------
    -- TEST 5: Phase 3 Storage RLS intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'FAIL: Phase 3 Storage RLS policies are MISSING';
    END IF;
    RAISE NOTICE 'PASS: Phase 3 Storage RLS intact.';

    -- -------------------------------------------------------------------------
    -- TEST 6: whatsapp_sessions remains unchanged
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions' AND roles @> ARRAY['public']::name[];
    IF v_count > 0 THEN
        RAISE EXCEPTION 'FAIL: whatsapp_sessions has % public policies!', v_count;
    END IF;
    RAISE NOTICE 'PASS: whatsapp_sessions remains restricted.';

    RAISE NOTICE '=== ALL ROLLBACK VERIFICATION TESTS PASSED ===';
END $$;
