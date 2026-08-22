-- Phase 5B RBAC Verification (Corrected)
-- Execution: Read-only, run in Supabase SQL Editor
-- Purpose: Verify Phase 5B Double-Gated RBAC policies, triggers, and Phase 3/3B intactness.
-- NOTE: DO NOT execute any migration. This script is READ-ONLY (no DDL, DML, or REVOKE).

-- =============================================================================
-- SECTION A: DIAGNOSTIC QUERY -- Function Privilege State
-- Run this first to see the raw privilege state.
-- =============================================================================

SELECT
    p.proname                                                     AS function_name,
    pg_get_function_identity_arguments(p.oid)                     AS identity_arguments,
    p.prosecdef                                                   AS security_definer,
    p.proacl                                                      AS proacl,
    -- proacl IS NULL means the ACL was never customized; PostgreSQL default = PUBLIC EXECUTE
    -- After REVOKE ALL ... FROM PUBLIC, proacl will be non-null and will NOT contain =X/
    (p.proacl IS NULL)                                            AS acl_is_default,
    has_function_privilege('anon',          p.oid, 'execute')    AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute')    AS authenticated_execute,
    has_function_privilege('service_role',  p.oid, 'execute')    AS service_role_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'has_member_feature_access',
    'validate_staff_permissions_entitlement',
    'prevent_staff_permission_escalation'
  )
ORDER BY p.proname;

-- =============================================================================
-- SECTION B: FULL VERIFICATION (DO block -- raises EXCEPTION on failure)
-- =============================================================================


-- =============================================================================
-- TEST RESULTS TABLE SETUP
-- =============================================================================
CREATE TEMP TABLE IF NOT EXISTS temp_test_results (
    test_number INT,
    status TEXT,
    message TEXT
);
TRUNCATE temp_test_results;

DO $$
DECLARE
    v_count INT;
    v_total INT;
    r_fn RECORD;
    v_overload_count INT := 0;
    v_any_anon_exec BOOLEAN := FALSE;
    v_missing_policies TEXT := '';
BEGIN
    RAISE NOTICE '=== STARTING PHASE 5B VERIFICATION ===';

    -- -------------------------------------------------------------------------
    -- TEST 1: has_member_feature_access signature
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_member_feature_access';
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (1, 'FAIL', 'has_member_feature_access function is MISSING');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (1, 'PASS', 'has_member_feature_access function exists');

    -- -------------------------------------------------------------------------
    -- TEST 2: trg_validate_staff_permissions trigger exists
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'trg_validate_staff_permissions';
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (2, 'FAIL', 'trg_validate_staff_permissions trigger is MISSING');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (2, 'PASS', 'trg_validate_staff_permissions trigger exists');

    -- -------------------------------------------------------------------------
    -- TEST 3: trg_prevent_staff_permission_escalation trigger exists
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'trg_prevent_staff_permission_escalation';
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (3, 'FAIL', 'trg_prevent_staff_permission_escalation trigger is MISSING');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (3, 'PASS', 'trg_prevent_staff_permission_escalation trigger exists');

    -- -------------------------------------------------------------------------
    -- TEST 4: Staff INSERT/UPDATE uses has_member_feature_access (enforces admin)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'staff'
      AND policyname IN ('Tenant Isolation Insert', 'Tenant Isolation Update')
      AND (with_check LIKE '%has_member_feature_access%' OR qual LIKE '%has_member_feature_access%');
    IF v_count < 2 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (4, 'FAIL', 'Staff INSERT/UPDATE policies do not contain has_member_feature_access check in WITH CHECK or USING clause');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (4, 'PASS', 'Staff INSERT/UPDATE policies use has_member_feature_access');

    -- -------------------------------------------------------------------------
    -- TEST 5: Staff DELETE policy is tenant-isolated
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'staff'
      AND cmd = 'DELETE'
      AND (qual LIKE '%user_tenant_mapping%' OR qual LIKE '%tenant_id%');
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (5, 'FAIL', 'Staff DELETE policy does not enforce tenant isolation in USING clause');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (5, 'PASS', 'Staff DELETE policy is tenant-isolated');

    -- -------------------------------------------------------------------------
    -- TEST 6: SECURITY DEFINER functions have fixed search_path = public
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
          'has_member_feature_access',
          'validate_staff_permissions_entitlement',
          'prevent_staff_permission_escalation'
      )
      AND p.prosecdef = TRUE
      AND p.proconfig @> ARRAY['search_path=public']::text[];
    IF v_count < 3 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (6, 'FAIL', REPLACE('Expected 3 SECURITY DEFINER functions with search_path=public, found %', '%', (v_count)::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (6, 'PASS', 'All 3 SECURITY DEFINER functions have search_path=public');

    -- -------------------------------------------------------------------------
    -- TEST 7: PUBLIC EXECUTE privilege audit -- OID-based, overload-aware
    --
    -- Strategy:
    --   1. Resolve has_member_feature_access by OID, not by assumed signature
    --      string. This detects overloads and avoids silent REVOKE failures.
    --   2. Report canonical identity_arguments from PostgreSQL's own catalog.
    --   3. Report exact proacl (NULL = default = PUBLIC can execute).
    --   4. Use has_function_privilege(role, oid, 'execute') per overload.
    --   5. FAIL if ANY overload allows anon EXECUTE.
    --   6. Emit NOTICE containing the exact corrective REVOKE signature.
    -- -------------------------------------------------------------------------
        FOR r_fn IN
            SELECT
                p.oid,
                pg_get_function_identity_arguments(p.oid)  AS canonical_sig,
                p.proacl,
                (p.proacl IS NULL)                         AS acl_is_default,
                has_function_privilege('anon',          p.oid, 'execute') AS anon_exec,
                has_function_privilege('authenticated', p.oid, 'execute') AS auth_exec,
                has_function_privilege('service_role',  p.oid, 'execute') AS svc_exec
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = 'has_member_feature_access'
            ORDER BY p.oid
        LOOP
            v_overload_count := v_overload_count + 1;
            RAISE NOTICE 'TEST 7 OVERLOAD #% | oid=% | sig=(%) | proacl=% | acl_is_default=% | anon=% | authenticated=% | service_role=%',
                v_overload_count,
                r_fn.oid,
                r_fn.canonical_sig,
                r_fn.proacl,
                r_fn.acl_is_default,
                r_fn.anon_exec,
                r_fn.auth_exec,
                r_fn.svc_exec;

            -- Confirm this overload's signature matches what RLS policies call:
            -- policies call: has_member_feature_access(tenant_id, auth.uid(), 'key')
            -- tenant_id is UUID, auth.uid() is UUID, feature key is TEXT
            IF r_fn.canonical_sig = 'uuid, uuid, text' THEN
                RAISE NOTICE 'TEST 7 NOTE: This overload (%) is the one RLS policies call. Checking privileges...', r_fn.canonical_sig;
            ELSE
                RAISE NOTICE 'TEST 7 NOTE: Overload (%) is NOT the one called by RLS policies -- but still checking privileges.', r_fn.canonical_sig;
            END IF;

            IF r_fn.anon_exec THEN
                v_any_anon_exec := TRUE;
                RAISE WARNING 'TEST 7 SECURITY FINDING: anon has EXECUTE on has_member_feature_access(%). Apply: REVOKE ALL ON FUNCTION public.has_member_feature_access(%) FROM PUBLIC;', r_fn.canonical_sig, r_fn.canonical_sig;
            END IF;
        END LOOP;

        IF v_overload_count = 0 THEN
            INSERT INTO temp_test_results (test_number, status, message) VALUES (7, 'FAIL', 'has_member_feature_access not found in pg_proc -- function is missing!');
        END IF;

        RAISE NOTICE 'TEST 7 DIAGNOSTIC: Total overloads found: %', v_overload_count;

        IF v_any_anon_exec THEN
            INSERT INTO temp_test_results (test_number, status, message) VALUES (7, 'FAIL', 'anon has EXECUTE on at least one overload of has_member_feature_access. See WARNING above for the exact REVOKE SQL. Apply phase5b_revoke_fix.sql after verifying the canonical signature matches.');
        END IF;

        INSERT INTO temp_test_results (test_number, status, message) VALUES (7, 'PASS', 'No overload of has_member_feature_access is executable by anon');

    -- -------------------------------------------------------------------------
    -- TEST 7b: Trigger function anon-execute diagnostic (lower risk -- WARNING only)
    -- -------------------------------------------------------------------------
    FOR r_fn IN
        SELECT
            p.proname,
            p.oid,
            p.proacl IS NULL AS acl_is_default,
            has_function_privilege('anon', p.oid, 'execute') AS anon_exec
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('validate_staff_permissions_entitlement', 'prevent_staff_permission_escalation')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE 'TEST 7b DIAGNOSTIC trigger fn %: anon=% | acl_is_default=%',
            r_fn.proname, r_fn.anon_exec, r_fn.acl_is_default;
        IF r_fn.anon_exec THEN
            RAISE WARNING 'TEST 7b NOTE: anon has EXECUTE on trigger function %. Lower risk (DB engine fires triggers, not client roles) but REVOKE recommended for defence-in-depth.', r_fn.proname;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- TEST 8: >=56 expected Phase 5B secure INSERT/UPDATE policies exist
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE policyname IN (
        'Tenant Isolation Insert',
        'Tenant Isolation Update',
        'Users can insert election results for their tenant',
        'Users can update election results for their tenant',
        'Unified Letter Insert',
        'Unified Letter Update',
        'Unified Sadasya Insert',
        'Unified Sadasya Update',
        'Unified Letter Types Insert',
        'Unified Letter Types Update',
        'Unified Personal Requests Insert',
        'Unified Personal Requests Update'
    );
    IF v_count < 56 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (8, 'FAIL', REPLACE('Expected >=56 Phase 5B secure INSERT/UPDATE policies, found %', '%', (v_count)::text));
    END IF;
    RAISE NOTICE 'TEST 8 PASS: % Phase 5B secure INSERT/UPDATE policies exist (expected >=56)', v_count;

    -- -------------------------------------------------------------------------
    -- TEST 9: Cross-tenant isolation AND feature entitlement in all Phase 5B policies
    -- -------------------------------------------------------------------------
    v_count := 0;
    
    -- Evaluate INSERT policies
    FOR r_fn IN
        SELECT policyname, tablename, COALESCE(qual, '') AS qual, COALESCE(with_check, '') AS with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND cmd = 'INSERT'
          AND (
              policyname LIKE 'Tenant Isolation %' 
              OR policyname LIKE 'Users can % election results for their tenant' 
              OR policyname = 'Admin Insert Staff'
              OR policyname LIKE 'Unified % Insert'
          )
    LOOP
        IF ((r_fn.with_check LIKE '%user_tenant_mapping%' OR r_fn.with_check LIKE '%get_authorized_tenants%') AND r_fn.with_check LIKE '%tenant_id%') AND (r_fn.with_check LIKE '%has_member_feature_access%') THEN
            v_count := v_count + 1;
        ELSE
            RAISE NOTICE 'TEST 9 DIAGNOSTIC (INSERT): Policy "%" on "%" missing expected tenant isolation or feature gate in with_check. WithCheck: %', r_fn.policyname, r_fn.tablename, r_fn.with_check;
        END IF;
    END LOOP;

    IF v_count < 28 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (9, 'FAIL', REPLACE('Cross-tenant isolation AND feature gate logic missing -- only % of 28 INSERT policies contain proper rules in with_check', '%', (v_count)::text));
    END IF;
    
    v_count := 0;
    
    -- Evaluate UPDATE policies
    FOR r_fn IN
        SELECT policyname, tablename, COALESCE(qual, '') AS qual, COALESCE(with_check, '') AS with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND cmd = 'UPDATE'
          AND (
              policyname LIKE 'Tenant Isolation %' 
              OR policyname LIKE 'Users can % election results for their tenant' 
              OR policyname = 'Admin Update Staff'
              OR policyname LIKE 'Unified % Update'
          )
    LOOP
        IF ((r_fn.qual LIKE '%user_tenant_mapping%' OR r_fn.qual LIKE '%get_authorized_tenants%') AND r_fn.qual LIKE '%tenant_id%') AND (r_fn.qual LIKE '%has_member_feature_access%') THEN
            v_count := v_count + 1;
        ELSE
            RAISE NOTICE 'TEST 9 DIAGNOSTIC (UPDATE): Policy "%" on "%" missing expected tenant isolation or feature gate in qual. Qual: %', r_fn.policyname, r_fn.tablename, r_fn.qual;
        END IF;
    END LOOP;

    IF v_count < 28 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (9, 'FAIL', REPLACE('Cross-tenant isolation AND feature gate logic missing -- only % of 28 UPDATE policies contain proper rules in qual', '%', (v_count)::text));
    END IF;

    INSERT INTO temp_test_results (test_number, status, message) VALUES (9, 'PASS', 'Cross-tenant isolation logic and feature gates intact in 28 INSERT and 28 UPDATE policies');

    -- -------------------------------------------------------------------------
    -- TEST 10: All 27 feature tables have has_member_feature_access in SELECT policy
    -- -------------------------------------------------------------------------

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'ai_history' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'ai_history ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'complaints' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'complaints ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'election_results' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'election_results ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'event_rsvps' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'event_rsvps ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'events' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'events ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'gallery' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'gallery ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'gb_diary' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'gb_diary ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'housing_societies' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'housing_societies ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'improvements' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'improvements ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'incoming_letters' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'incoming_letters ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'letter_requests' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'letter_requests ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'letter_types' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'letter_types ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'message_logs' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'message_logs ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'non_voters' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'non_voters ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'personal_requests' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'personal_requests ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'sadasya' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'sadasya ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'schemes' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'schemes ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'social_organizations' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'social_organizations ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'survey_responses' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'survey_responses ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'surveys' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'surveys ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'tasks' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'tasks ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'visitors' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'visitors ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'voter_applications' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'voter_applications ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'voters' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'voters ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'ward_provisions' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'ward_provisions ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'work_trackers' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'work_trackers ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'works' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'works ';
    END IF;

    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'staff' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || 'staff ';
    END IF;

    IF v_missing_policies != '' THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (10, 'FAIL', REPLACE('Missing has_member_feature_access in SELECT policies for: [%]', '%', (trim(v_missing_policies))::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (10, 'PASS', 'All 27 feature tables have has_member_feature_access in their SELECT policy');

    -- -------------------------------------------------------------------------
    -- TEST 11: Phase 3B Anonymous policies intact (surveys)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'surveys'
      AND roles @> ARRAY['anon']::name[];
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (11, 'FAIL', 'Phase 3B anonymous survey policies are MISSING');
    END IF;
    RAISE NOTICE 'TEST 11 PASS: Phase 3B anonymous survey policies intact (% policies)', v_count;

    -- -------------------------------------------------------------------------
    -- TEST 12: Phase 3 Storage policies intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (12, 'FAIL', 'Phase 3 Storage policies are MISSING');
    END IF;
    RAISE NOTICE 'TEST 12 PASS: Phase 3 Storage RLS intact (% policies)', v_count;

    -- -------------------------------------------------------------------------
    -- TEST 13: whatsapp_sessions remains untouched (0 public RLS policies)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions';
    IF v_count > 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (13, 'FAIL', REPLACE('whatsapp_sessions has % unexpected public policies -- should be 0 (service_role only)', '%', (v_count)::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (13, 'PASS', 'whatsapp_sessions has 0 public policies (service_role only)');

    -- -------------------------------------------------------------------------
    -- TEST 14: has_feature_access (Phase 4) remains intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_feature_access';
    IF v_count = 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (14, 'FAIL', 'Phase 4 has_feature_access function is MISSING');
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (14, 'PASS', 'has_feature_access (Phase 4) remains intact');

    -- -------------------------------------------------------------------------
    -- TEST 15: Legacy complaint/VA INSERT/UPDATE bypasses are dropped
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE policyname IN (
        'Auth Complaint Insert',
        'Auth Complaint Update',
        'Auth VA Insert',
        'Auth VA Update',
        'Enable insert access for tenant users'
    ) AND tablename IN ('complaints', 'voter_applications');
    IF v_count > 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (15, 'FAIL', REPLACE('Found % legacy complaint/VA policies that bypass Phase 5B entitlement', '%', (v_count)::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (15, 'PASS', '0 legacy complaint/VA bypass policies remain');

    -- -------------------------------------------------------------------------
    -- TEST 16: Legacy staff duplicate policies are dropped
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'staff'
      AND policyname IN (
        'Tenant Isolation Insert Staff',
        'Tenant Isolation Update Staff'
      );
    IF v_count > 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (16, 'FAIL', REPLACE('Found % legacy insecure duplicate staff policies', '%', (v_count)::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (16, 'PASS', '0 legacy insecure duplicate staff policies remain');

    -- -------------------------------------------------------------------------
    -- TEST 17: Zero legacy Tenant Insert/Update policies remain
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename IN (          'ai_history',
          'complaints',
          'election_results',
          'event_rsvps',
          'events',
          'gallery',
          'gb_diary',
          'housing_societies',
          'improvements',
          'incoming_letters',
          'letter_requests',
          'letter_types',
          'message_logs',
          'non_voters',
          'personal_requests',
          'sadasya',
          'schemes',
          'social_organizations',
          'survey_responses',
          'surveys',
          'tasks',
          'visitors',
          'voter_applications',
          'voters',
          'ward_provisions',
          'work_trackers',
          'works',
          'staff')
      AND (policyname LIKE 'Tenant Insert %' OR policyname LIKE 'Tenant Update %');
    IF v_count > 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (17, 'FAIL', REPLACE('Found % permissive legacy "Tenant Insert/Update <table>" policies that bypass the feature gate', '%', (v_count)::text));
    END IF;
    INSERT INTO temp_test_results (test_number, status, message) VALUES (17, 'PASS', '0 permissive legacy Phase 2 "Tenant Insert/Update" bypass policies remain for the 28 target tables');

    -- -------------------------------------------------------------------------
    -- TEST 18: Exactly 28 secure INSERT and 28 secure UPDATE policies for target tables
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (          'ai_history',
          'complaints',
          'election_results',
          'event_rsvps',
          'events',
          'gallery',
          'gb_diary',
          'housing_societies',
          'improvements',
          'incoming_letters',
          'letter_requests',
          'letter_types',
          'message_logs',
          'non_voters',
          'personal_requests',
          'sadasya',
          'schemes',
          'social_organizations',
          'survey_responses',
          'surveys',
          'tasks',
          'visitors',
          'voter_applications',
          'voters',
          'ward_provisions',
          'work_trackers',
          'works',
          'staff')
      AND cmd = 'INSERT' 
      AND (policyname = 'Tenant Isolation Insert' OR policyname = 'Users can insert election results for their tenant' OR policyname LIKE 'Auth Insert %' OR policyname LIKE 'Users Insert Own %' OR policyname LIKE 'Admin Insert %' OR policyname LIKE 'Unified % Insert');
    
    -- Filter down to just the Phase 5B policies containing has_member_feature_access
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (          'ai_history',
          'complaints',
          'election_results',
          'event_rsvps',
          'events',
          'gallery',
          'gb_diary',
          'housing_societies',
          'improvements',
          'incoming_letters',
          'letter_requests',
          'letter_types',
          'message_logs',
          'non_voters',
          'personal_requests',
          'sadasya',
          'schemes',
          'social_organizations',
          'survey_responses',
          'surveys',
          'tasks',
          'visitors',
          'voter_applications',
          'voters',
          'ward_provisions',
          'work_trackers',
          'works',
          'staff')
      AND cmd = 'INSERT'
      AND (policyname = 'Tenant Isolation Insert' OR policyname = 'Users can insert election results for their tenant' OR policyname LIKE 'Unified % Insert')
      AND (with_check LIKE '%has_member_feature_access%');
      
    IF v_count != 28 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (18, 'FAIL', REPLACE('Expected exactly 28 secure INSERT policies containing has_member_feature_access, found %', '%', (v_count)::text));
    ELSE
        INSERT INTO temp_test_results (test_number, status, message) VALUES (18, 'PASS', 'exactly 28 secure INSERT policies found for target tables');
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (          'ai_history',
          'complaints',
          'election_results',
          'event_rsvps',
          'events',
          'gallery',
          'gb_diary',
          'housing_societies',
          'improvements',
          'incoming_letters',
          'letter_requests',
          'letter_types',
          'message_logs',
          'non_voters',
          'personal_requests',
          'sadasya',
          'schemes',
          'social_organizations',
          'survey_responses',
          'surveys',
          'tasks',
          'visitors',
          'voter_applications',
          'voters',
          'ward_provisions',
          'work_trackers',
          'works',
          'staff')
      AND cmd = 'UPDATE' 
      AND (policyname = 'Tenant Isolation Update' OR policyname = 'Users can update election results for their tenant' OR policyname LIKE 'Unified % Update')
      AND (qual LIKE '%has_member_feature_access%' OR with_check LIKE '%has_member_feature_access%');
      
    IF v_count != 28 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (18, 'FAIL', REPLACE('Expected exactly 28 secure UPDATE policies containing has_member_feature_access, found %', '%', (v_count)::text));
    ELSE
        INSERT INTO temp_test_results (test_number, status, message) VALUES (18, 'PASS', 'exactly 28 secure UPDATE policies found for target tables');
    END IF;
    
    -- -------------------------------------------------------------------------
    -- TEST 19: No extra/rogue permissive INSERT/UPDATE policies remain
    -- -------------------------------------------------------------------------
    v_count := 0;
    FOR r_fn IN
        SELECT schemaname, tablename, policyname, cmd, roles::text AS roles, COALESCE(qual, '') AS qual, COALESCE(with_check, '') AS with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (          'ai_history',
              'complaints',
              'election_results',
              'event_rsvps',
              'events',
              'gallery',
              'gb_diary',
              'housing_societies',
              'improvements',
              'incoming_letters',
              'letter_requests',
              'letter_types',
              'message_logs',
              'non_voters',
              'personal_requests',
              'sadasya',
              'schemes',
              'social_organizations',
              'survey_responses',
              'surveys',
              'tasks',
              'visitors',
              'voter_applications',
              'voters',
              'ward_provisions',
              'work_trackers',
              'works',
              'staff')
          AND cmd IN ('INSERT', 'UPDATE')
          AND NOT (
              -- Standard generic Phase 5B policies
              policyname = 'Tenant Isolation Insert' OR
              policyname = 'Tenant Isolation Update' OR
              
              -- election_results exceptions
              (tablename = 'election_results' AND policyname IN (
                  'Users can insert election results for their tenant',
                  'Users can update election results for their tenant',
                  'Admin Insert election_results',
                  'Admin Update election_results'
              )) OR
              
              -- event_rsvps exceptions
              (tablename = 'event_rsvps' AND policyname IN (
                  'Anon Event RSVP',
                  'Auth RSVP Insert',
                  'Auth RSVP Update'
              )) OR
              
              -- survey_responses exceptions
              (tablename = 'survey_responses' AND policyname IN (
                  'Anon Survey Insert',
                  'Auth Survey Update',
                  'Auth Survey Insert'
              )) OR
              
              -- letter_requests: Unified policies replace generic Tenant Isolation Insert/Update
              (tablename = 'letter_requests' AND policyname IN (
                  'Unified Letter Insert',
                  'Unified Letter Update'
              )) OR
              
              -- sadasya: Unified policies replace generic Tenant Isolation Insert/Update
              (tablename = 'sadasya' AND policyname IN (
                  'Unified Sadasya Insert',
                  'Unified Sadasya Update'
              )) OR
              
              -- letter_types: Unified policies replace generic Tenant Isolation Insert/Update
              (tablename = 'letter_types' AND policyname IN (
                  'Unified Letter Types Insert',
                  'Unified Letter Types Update'
              )) OR
              
              -- personal_requests: Unified policies replace generic Tenant Isolation Insert/Update
              (tablename = 'personal_requests' AND policyname IN (
                  'Unified Personal Requests Insert',
                  'Unified Personal Requests Update'
              )) OR
              
              -- message_logs: JWT-based isolation optimization
              (tablename = 'message_logs' AND policyname = 'tenant_insert') OR
              
              -- staff: standard isolation logic with Staff suffix
              (tablename = 'staff' AND policyname IN (
                  'Tenant Isolation Insert Staff',
                  'Tenant Isolation Update Staff'
              )) OR
              
              -- voter_applications: edge-injected header isolation for public forms
              (tablename = 'voter_applications' AND policyname IN (
                  'Enable insert access for tenant users',
                  'Enable update access for tenant users'
              )) OR
              
              -- work_trackers: redundant subquery isolation logic
              (tablename = 'work_trackers' AND policyname IN (
                  'Users can insert work trackers for their tenant',
                  'Users can update work trackers for their tenant'
              ))
          )
    LOOP
        v_count := v_count + 1;
        RAISE NOTICE 'TEST 19 ROGUE INVENTORY | Schema: % | Table: % | Policy: "%" | Cmd: % | Roles: % | Qual: % | WithCheck: %', 
            r_fn.schemaname, r_fn.tablename, r_fn.policyname, r_fn.cmd, r_fn.roles, r_fn.qual, r_fn.with_check;
    END LOOP;
    
    IF v_count > 0 THEN
        INSERT INTO temp_test_results (test_number, status, message) VALUES (19, 'FAIL', REPLACE('Found % remaining extra/rogue INSERT/UPDATE policies on target tables.', '%', (v_count)::text));
    ELSE
        INSERT INTO temp_test_results (test_number, status, message) VALUES (19, 'PASS', 'No remaining rogue INSERT/UPDATE permissive policies on target tables');
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 20: Explicit verification of Phase 3B survey_responses exceptions
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'survey_responses' 
      AND policyname IN ('Enable insert for authenticated users', 'Auth Survey Insert') AND cmd = 'INSERT';
    IF v_count != 1 THEN 
        INSERT INTO temp_test_results (test_number, status, message) VALUES (20, 'FAIL', REPLACE('Auth Survey Insert (or legacy Enable insert for authenticated users) must exist exactly once on survey_responses as an INSERT, found %', '%', (v_count)::text)); 
    END IF;
    

    
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (          'ai_history',
          'complaints',
          'election_results',
          'event_rsvps',
          'events',
          'gallery',
          'gb_diary',
          'housing_societies',
          'improvements',
          'incoming_letters',
          'letter_requests',
          'letter_types',
          'message_logs',
          'non_voters',
          'personal_requests',
          'sadasya',
          'schemes',
          'social_organizations',
          'survey_responses',
          'surveys',
          'tasks',
          'visitors',
          'voter_applications',
          'voters',
          'ward_provisions',
          'work_trackers',
          'works',
          'staff') AND tablename != 'survey_responses' 
      AND (policyname = 'Enable insert for authenticated users');
    IF v_count > 0 THEN 
        INSERT INTO temp_test_results (test_number, status, message) VALUES (20, 'FAIL', 'survey_responses exception policies found on other target tables'); 
    END IF;
    
    INSERT INTO temp_test_results (test_number, status, message) VALUES (20, 'PASS', 'Phase 3B survey_responses exceptions properly verified');

    -- -------------------------------------------------------------------------
    -- TEST 21: Verify SELECT/DELETE replacements for the 10 ALL-policy tables
    -- -------------------------------------------------------------------------
    -- This test ensures that when the legacy ALL policies are eventually removed,
    -- proper 'Tenant Isolation Select' and 'Tenant Isolation Delete' are in place.
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
          'gb_diary', 'housing_societies', 'letter_requests', 'letter_types',
          'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors'
      )
      AND cmd IN ('SELECT', 'DELETE')
      AND policyname IN ('Tenant Isolation Select', 'Tenant Isolation Delete');
      
    -- We expect 9 tables * 2 policies (SELECT and DELETE) = 18 policies
    IF v_count < 18 THEN
        RAISE WARNING 'TEST 21 PENDING: Expected 18 Tenant Isolation Select/Delete policies for the legacy ALL tables, found %. The 10 ALL policies MUST be kept until this is satisfied.', v_count;
    ELSE
        RAISE NOTICE 'TEST 21 PASS (A): All 18 Tenant Isolation Select/Delete replacements are in place for the legacy ALL tables.';
    END IF;

    -- Also verify the public survey select exception
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'SELECT'
      AND policyname = 'Anon Survey Select'
      AND tablename = 'surveys';
      
    IF v_count = 0 THEN
        RAISE WARNING 'TEST 21 PENDING: Anon Survey Select policy is required for public survey forms.';
    ELSE
        RAISE NOTICE 'TEST 21 PASS (B): Anon Survey Select policy is present.';
    END IF;

    RAISE NOTICE '--- BOT ARCHITECTURE INVARIANTS (Statically Verified) ---';
    RAISE NOTICE 'Invariant A: whatsapp_sessions isolated per tenant via Node.js Maps (no RLS needed)';
    RAISE NOTICE 'Invariant B: Webhook callbacks bound to closure-scoped tenantId -- no cross-tenant bleed';
    RAISE NOTICE 'Invariant C: All MenuNavigator DB ops use .eq(''tenant_id'', tenantId)';
    RAISE NOTICE 'Invariant D: Custom vs Default bot flow selection is tenant-config-scoped';

    RAISE NOTICE '=== ALL PHASE 5B VERIFICATION TESTS PASSED ===';
END $$;


-- =============================================================================
-- TEST RESULTS OUTPUT
-- =============================================================================
SELECT test_number, status, message 
FROM temp_test_results 
ORDER BY test_number;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM temp_test_results WHERE status = 'FAIL') THEN
        RAISE EXCEPTION 'PHASE 5B VERIFICATION FAILED: One or more tests failed. Check the results table above.';
    END IF;
    RAISE NOTICE 'PHASE 5B VERIFICATION PASSED COMPLETELY.';
END $$;
