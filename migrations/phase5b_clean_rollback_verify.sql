-- =============================================================================
-- Phase 5B -- CLEAN ROLLBACK VERIFICATION
-- File: phase5b_clean_rollback_verify.sql
--
-- PURPOSE:
--   Verify that the 112 Phase 5B policies were dropped, zero Phase 5B objects 
--   remain, and the original Phase 4, Phase 3, and Phase 3B boundaries are intact.
--
-- SAFE: Read-only DO block. Zero DDL, DML, or modification statements.
-- =============================================================================

DO $$
DECLARE
    v_phase5b_policy_count      INT;
    v_has_member_refs           INT;
    v_funcs_count               INT;
    v_phase4_func_count         INT;
    v_trigger_count             INT;
    v_anon_policy_count         INT;
    v_storage_policy_count      INT;
    v_wa_public_policy_count    INT;
    v_phase4_policy_count       INT;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '   PHASE 5B CLEAN ROLLBACK VERIFICATION';
    RAISE NOTICE '==================================================';

    -- 1. 112 Phase 5B policies removed?
    SELECT COUNT(*) INTO v_phase5b_policy_count
    FROM pg_policies
    WHERE policyname IN (
        'Allow select based on tenant_id',
        'Allow insert based on tenant_id',
        'Allow update based on tenant_id',
        'Allow delete based on tenant_id'
    );
    IF v_phase5b_policy_count > 0 THEN
        RAISE EXCEPTION 'FAIL: % Phase 5B policies still exist. (Expected: 0)', v_phase5b_policy_count;
    END IF;
    RAISE NOTICE 'PASS: 0 Phase 5B policies remain.';

    -- 2. 0 remaining has_member_feature_access policy references?
    SELECT COUNT(*) INTO v_has_member_refs
    FROM pg_policies
    WHERE qual LIKE '%has_member_feature_access%' 
       OR with_check LIKE '%has_member_feature_access%';
    IF v_has_member_refs > 0 THEN
        RAISE EXCEPTION 'FAIL: % policies still reference has_member_feature_access. (Expected: 0)', v_has_member_refs;
    END IF;
    RAISE NOTICE 'PASS: 0 policies reference has_member_feature_access.';

    -- 3. 0 Phase 5B functions?
    SELECT COUNT(*) INTO v_funcs_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname IN (
          'has_member_feature_access', 
          'validate_staff_permissions_entitlement', 
          'prevent_staff_permission_escalation'
      );
    IF v_funcs_count > 0 THEN
        RAISE EXCEPTION 'FAIL: % Phase 5B functions still exist. (Expected: 0)', v_funcs_count;
    END IF;
    RAISE NOTICE 'PASS: 0 Phase 5B functions remain.';

    -- 4. 0 Phase 5B triggers?
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname IN ('trg_validate_staff_permissions', 'trg_prevent_staff_permission_escalation');
    IF v_trigger_count > 0 THEN
        RAISE EXCEPTION 'FAIL: % Phase 5B triggers still exist. (Expected: 0)', v_trigger_count;
    END IF;
    RAISE NOTICE 'PASS: 0 Phase 5B triggers remain.';

    -- 5. Original Phase 4 policies still exist? (Check for Tenant Isolation variants)
    SELECT COUNT(*) INTO v_phase4_policy_count
    FROM pg_policies
    WHERE policyname LIKE 'Tenant Isolation%';
    IF v_phase4_policy_count < 50 THEN
        RAISE EXCEPTION 'FAIL: Only % Phase 4 "Tenant Isolation" policies found. Expected > 50.', v_phase4_policy_count;
    END IF;
    RAISE NOTICE 'PASS: Phase 4 "Tenant Isolation" policies are active and intact (Count: %).', v_phase4_policy_count;

    -- 6. Phase 3B public policies remain intact?
    SELECT COUNT(*) INTO v_anon_policy_count
    FROM pg_policies
    WHERE tablename = 'surveys' AND roles @> ARRAY['anon']::name[];
    IF v_anon_policy_count = 0 THEN
        RAISE EXCEPTION 'FAIL: Phase 3B anonymous survey policies are missing!';
    END IF;
    RAISE NOTICE 'PASS: Phase 3B anonymous policies remain intact.';

    -- 7. Storage RLS remains intact?
    SELECT COUNT(*) INTO v_storage_policy_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    IF v_storage_policy_count = 0 THEN
        RAISE EXCEPTION 'FAIL: Storage RLS policies are missing!';
    END IF;
    RAISE NOTICE 'PASS: Storage RLS remains intact.';

    -- 8. whatsapp_sessions remains unchanged?
    SELECT COUNT(*) INTO v_wa_public_policy_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions' AND roles @> ARRAY['public']::name[];
    IF v_wa_public_policy_count > 0 THEN
        RAISE EXCEPTION 'FAIL: whatsapp_sessions has % public policies!', v_wa_public_policy_count;
    END IF;
    RAISE NOTICE 'PASS: whatsapp_sessions restricted policies remain intact.';

    RAISE NOTICE '==================================================';
    RAISE NOTICE '   DATABASE IS CLEAN (RESTORED TO PHASE 4)';
    RAISE NOTICE '==================================================';
END $$;
