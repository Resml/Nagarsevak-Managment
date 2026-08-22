-- =============================================================================
-- Phase 5B -- ROLLBACK DIAGNOSIS
-- File: phase5b_rollback_diagnosis.sql
--
-- PURPOSE:
--   Diagnose the current state of the database to determine if the rollback 
--   was successful, failed, or partially applied. It evaluates functions, 
--   triggers, and policy expressions without failing or modifying data.
--
-- SAFE: Read-only DO block. Zero DDL, DML, or modification statements.
-- =============================================================================

DO $$
DECLARE
    v_phase5b_policy_count      INT;
    v_has_member_refs           INT;
    v_funcs_count               INT;
    v_phase4_func_count         INT;
    v_unqualified_tenant_count  INT;
    v_qualified_tenant_count    INT;
    v_trigger_count             INT;
    v_anon_policy_count         INT;
    v_storage_policy_count      INT;
    v_wa_public_policy_count    INT;
    
    v_status                    TEXT := 'SAFE TO CLEANUP';
    r                           RECORD;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '   PHASE 5B ROLLBACK DIAGNOSIS';
    RAISE NOTICE '==================================================';

    -- 1. All 112 Phase 5B policies still exist? (Count by standard name)
    SELECT COUNT(*) INTO v_phase5b_policy_count
    FROM pg_policies
    WHERE policyname IN (
        'Allow select based on tenant_id',
        'Allow insert based on tenant_id',
        'Allow update based on tenant_id',
        'Allow delete based on tenant_id'
    );
    RAISE NOTICE '1. Base tenant-isolated policies count: % (Expected: >=112)', v_phase5b_policy_count;

    -- 2. References to has_member_feature_access in live policies
    SELECT COUNT(*) INTO v_has_member_refs
    FROM pg_policies
    WHERE qual LIKE '%has_member_feature_access%' 
       OR with_check LIKE '%has_member_feature_access%';
    RAISE NOTICE '2. Policies calling has_member_feature_access: % (Expected: 0 if rolled back)', v_has_member_refs;

    -- 3. Phase 5B functions and exact signatures
    SELECT COUNT(*) INTO v_funcs_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
      AND p.proname IN (
          'has_member_feature_access', 
          'validate_staff_permissions_entitlement', 
          'prevent_staff_permission_escalation'
      );
    
    RAISE NOTICE '3. Phase 5B functions existing: % (Expected: 0 if rolled back)', v_funcs_count;
    
    FOR r IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'has_member_feature_access', 
              'validate_staff_permissions_entitlement', 
              'prevent_staff_permission_escalation'
          )
    LOOP
        RAISE NOTICE '   -> Found: %(%) [OID: %]', r.proname, r.sig, r.oid;
    END LOOP;

    -- 4. Phase 4 has_feature_access function
    SELECT COUNT(*) INTO v_phase4_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_feature_access';
    RAISE NOTICE '4. Phase 4 has_feature_access() exists: % (Expected: 1)', v_phase4_func_count;

    -- 5. user_tenant_mapping qualification condition
    SELECT COUNT(*) INTO v_unqualified_tenant_count
    FROM pg_policies
    WHERE policyname LIKE 'Allow % based on tenant_id'
      AND (qual LIKE '%utm.tenant_id = utm.tenant_id%' OR with_check LIKE '%utm.tenant_id = utm.tenant_id%');
    
    SELECT COUNT(*) INTO v_qualified_tenant_count
    FROM pg_policies
    WHERE policyname LIKE 'Allow % based on tenant_id'
      AND (qual LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%' 
           OR with_check LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%');

    RAISE NOTICE '5. Tenant Isolation Scoping:';
    RAISE NOTICE '   -> Unqualified BUG (utm.tenant_id = utm.tenant_id): % (Expected: 0)', v_unqualified_tenant_count;
    RAISE NOTICE '   -> Properly qualified (<table_name>.tenant_id):     % (Expected: >=112)', v_qualified_tenant_count;

    -- 6. Phase 5B triggers on staff
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname IN ('trg_validate_staff_permissions', 'trg_prevent_staff_permission_escalation');
    RAISE NOTICE '6. Phase 5B triggers on staff: % (Expected: 0 if rolled back)', v_trigger_count;

    -- 7. Phase 3B anonymous survey/response policies
    SELECT COUNT(*) INTO v_anon_policy_count
    FROM pg_policies
    WHERE tablename = 'surveys' AND roles @> ARRAY['anon']::name[];
    RAISE NOTICE '7. Phase 3B anonymous survey policies: % (Expected: >0)', v_anon_policy_count;

    -- 8a. Storage RLS
    SELECT COUNT(*) INTO v_storage_policy_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    RAISE NOTICE '8. Storage objects policies: % (Expected: >0)', v_storage_policy_count;

    -- 8b. whatsapp_sessions
    SELECT COUNT(*) INTO v_wa_public_policy_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions' AND roles @> ARRAY['public']::name[];
    RAISE NOTICE '9. whatsapp_sessions public policies: % (Expected: 0)', v_wa_public_policy_count;

    RAISE NOTICE '==================================================';
    
    -- CLASSIFICATION LOGIC
    IF v_has_member_refs > 0 OR v_unqualified_tenant_count > 0 THEN
        -- If it still relies on has_member_feature_access OR has the tautology bug, rollback is not complete.
        v_status := 'ROLLBACK FAILED (Or Not Yet Executed)';
    ELSIF v_funcs_count > 0 OR v_trigger_count > 0 THEN
        -- If policies are clean but functions/triggers were left behind.
        v_status := 'PARTIALLY ROLLED BACK (Policies reverted, but functions/triggers remain)';
    ELSIF v_phase4_func_count = 0 OR v_anon_policy_count = 0 OR v_storage_policy_count = 0 THEN
        -- If critical older phase boundaries were destroyed.
        v_status := 'ROLLBACK FAILED (Critical Phase 2/3/4 boundaries missing)';
    ELSE
        v_status := 'SAFE TO CLEANUP (Fully rolled back to Phase 4)';
    END IF;

    RAISE NOTICE 'CLASSIFICATION: %', v_status;
    RAISE NOTICE '==================================================';
END $$;
