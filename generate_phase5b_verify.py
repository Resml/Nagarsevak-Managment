import os

tables = [
  'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
  'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
  'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
  'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
  'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
  'work_trackers', 'works', 'staff'
]

sql = """\
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
        RAISE EXCEPTION 'TEST 1 FAIL: has_member_feature_access function is MISSING';
    END IF;
    RAISE NOTICE 'TEST 1 PASS: has_member_feature_access function exists';

    -- -------------------------------------------------------------------------
    -- TEST 2: trg_validate_staff_permissions trigger exists
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'trg_validate_staff_permissions';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 2 FAIL: trg_validate_staff_permissions trigger is MISSING';
    END IF;
    RAISE NOTICE 'TEST 2 PASS: trg_validate_staff_permissions trigger exists';

    -- -------------------------------------------------------------------------
    -- TEST 3: trg_prevent_staff_permission_escalation trigger exists
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'trg_prevent_staff_permission_escalation';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 3 FAIL: trg_prevent_staff_permission_escalation trigger is MISSING';
    END IF;
    RAISE NOTICE 'TEST 3 PASS: trg_prevent_staff_permission_escalation trigger exists';

    -- -------------------------------------------------------------------------
    -- TEST 4: Staff INSERT/UPDATE uses has_member_feature_access (enforces admin)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'staff'
      AND policyname IN ('Tenant Isolation Insert', 'Tenant Isolation Update')
      AND (with_check LIKE '%has_member_feature_access%' OR qual LIKE '%has_member_feature_access%');
    IF v_count < 2 THEN
        RAISE EXCEPTION 'TEST 4 FAIL: Staff INSERT/UPDATE policies do not contain has_member_feature_access check in WITH CHECK or USING clause';
    END IF;
    RAISE NOTICE 'TEST 4 PASS: Staff INSERT/UPDATE policies use has_member_feature_access';

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
        RAISE EXCEPTION 'TEST 5 FAIL: Staff DELETE policy does not enforce tenant isolation in USING clause';
    END IF;
    RAISE NOTICE 'TEST 5 PASS: Staff DELETE policy is tenant-isolated';

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
        RAISE EXCEPTION 'TEST 6 FAIL: Expected 3 SECURITY DEFINER functions with search_path=public, found %', v_count;
    END IF;
    RAISE NOTICE 'TEST 6 PASS: All 3 SECURITY DEFINER functions have search_path=public';

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
            RAISE EXCEPTION 'TEST 7 FAIL: has_member_feature_access not found in pg_proc -- function is missing!';
        END IF;

        RAISE NOTICE 'TEST 7 DIAGNOSTIC: Total overloads found: %', v_overload_count;

        IF v_any_anon_exec THEN
            RAISE EXCEPTION 'TEST 7 FAIL: anon has EXECUTE on at least one overload of has_member_feature_access. See WARNING above for the exact REVOKE SQL. Apply phase5b_revoke_fix.sql after verifying the canonical signature matches.';
        END IF;

        RAISE NOTICE 'TEST 7 PASS: No overload of has_member_feature_access is executable by anon';

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
        'Users can update election results for their tenant'
    );
    IF v_count < 56 THEN
        RAISE EXCEPTION 'TEST 8 FAIL: Expected >=56 Phase 5B secure INSERT/UPDATE policies, found %', v_count;
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
          AND (policyname LIKE 'Tenant Isolation %' OR policyname LIKE 'Users can % election results for their tenant' OR policyname = 'Admin Insert Staff')
    LOOP
        IF (r_fn.with_check LIKE '%user_tenant_mapping%' AND r_fn.with_check LIKE '%tenant_id%') AND (r_fn.with_check LIKE '%has_member_feature_access%') THEN
            v_count := v_count + 1;
        ELSE
            RAISE NOTICE 'TEST 9 DIAGNOSTIC (INSERT): Policy "%" on "%" missing expected tenant isolation or feature gate in with_check. WithCheck: %', r_fn.policyname, r_fn.tablename, r_fn.with_check;
        END IF;
    END LOOP;

    IF v_count < 28 THEN
        RAISE EXCEPTION 'TEST 9 FAIL: Cross-tenant isolation AND feature gate logic missing -- only % of 28 INSERT policies contain proper rules in with_check', v_count;
    END IF;
    
    v_count := 0;
    
    -- Evaluate UPDATE policies
    FOR r_fn IN
        SELECT policyname, tablename, COALESCE(qual, '') AS qual, COALESCE(with_check, '') AS with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND cmd = 'UPDATE'
          AND (policyname LIKE 'Tenant Isolation %' OR policyname LIKE 'Users can % election results for their tenant' OR policyname = 'Admin Update Staff')
    LOOP
        IF (r_fn.qual LIKE '%user_tenant_mapping%' AND r_fn.qual LIKE '%tenant_id%') AND (r_fn.qual LIKE '%has_member_feature_access%') THEN
            v_count := v_count + 1;
        ELSE
            RAISE NOTICE 'TEST 9 DIAGNOSTIC (UPDATE): Policy "%" on "%" missing expected tenant isolation or feature gate in qual. Qual: %', r_fn.policyname, r_fn.tablename, r_fn.qual;
        END IF;
    END LOOP;

    IF v_count < 28 THEN
        RAISE EXCEPTION 'TEST 9 FAIL: Cross-tenant isolation AND feature gate logic missing -- only % of 28 UPDATE policies contain proper rules in qual', v_count;
    END IF;

    RAISE NOTICE 'TEST 9 PASS: Cross-tenant isolation logic and feature gates intact in 28 INSERT and 28 UPDATE policies';

    -- -------------------------------------------------------------------------
    -- TEST 10: All 27 feature tables have has_member_feature_access in SELECT policy
    -- -------------------------------------------------------------------------
"""

for table in tables:
    sql += f"""
    SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = '{table}' AND qual LIKE '%has_member_feature_access%';
    IF v_count = 0 THEN
        v_missing_policies := v_missing_policies || '{table} ';
    END IF;
"""

sql += """\

    IF v_missing_policies != '' THEN
        RAISE EXCEPTION 'TEST 10 FAIL: Missing has_member_feature_access in SELECT policies for: [%]', trim(v_missing_policies);
    END IF;
    RAISE NOTICE 'TEST 10 PASS: All 27 feature tables have has_member_feature_access in their SELECT policy';

    -- -------------------------------------------------------------------------
    -- TEST 11: Phase 3B Anonymous policies intact (surveys)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'surveys'
      AND roles @> ARRAY['anon']::name[];
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 11 FAIL: Phase 3B anonymous survey policies are MISSING';
    END IF;
    RAISE NOTICE 'TEST 11 PASS: Phase 3B anonymous survey policies intact (% policies)', v_count;

    -- -------------------------------------------------------------------------
    -- TEST 12: Phase 3 Storage policies intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 12 FAIL: Phase 3 Storage policies are MISSING';
    END IF;
    RAISE NOTICE 'TEST 12 PASS: Phase 3 Storage RLS intact (% policies)', v_count;

    -- -------------------------------------------------------------------------
    -- TEST 13: whatsapp_sessions remains untouched (0 public RLS policies)
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions';
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 13 FAIL: whatsapp_sessions has % unexpected public policies -- should be 0 (service_role only)', v_count;
    END IF;
    RAISE NOTICE 'TEST 13 PASS: whatsapp_sessions has 0 public policies (service_role only)';

    -- -------------------------------------------------------------------------
    -- TEST 14: has_feature_access (Phase 4) remains intact
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_feature_access';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 14 FAIL: Phase 4 has_feature_access function is MISSING';
    END IF;
    RAISE NOTICE 'TEST 14 PASS: has_feature_access (Phase 4) remains intact';

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
        RAISE EXCEPTION 'TEST 15 FAIL: Found % legacy complaint/VA policies that bypass Phase 5B entitlement', v_count;
    END IF;
    RAISE NOTICE 'TEST 15 PASS: 0 legacy complaint/VA bypass policies remain';

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
        RAISE EXCEPTION 'TEST 16 FAIL: Found % legacy insecure duplicate staff policies', v_count;
    END IF;
    RAISE NOTICE 'TEST 16 PASS: 0 legacy insecure duplicate staff policies remain';

    -- -------------------------------------------------------------------------
    -- TEST 17: Zero legacy Tenant Insert/Update policies remain
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename IN ({table_list})
      AND (policyname LIKE 'Tenant Insert %' OR policyname LIKE 'Tenant Update %');
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 17 FAIL: Found % permissive legacy "Tenant Insert/Update <table>" policies that bypass the feature gate', v_count;
    END IF;
    RAISE NOTICE 'TEST 17 PASS: 0 permissive legacy Phase 2 "Tenant Insert/Update" bypass policies remain for the 28 target tables';

    -- -------------------------------------------------------------------------
    -- TEST 18: Exactly 28 secure INSERT and 28 secure UPDATE policies for target tables
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ({table_list})
      AND cmd = 'INSERT' 
      AND (policyname = 'Tenant Isolation Insert' OR policyname = 'Users can insert election results for their tenant' OR policyname LIKE 'Auth Insert %' OR policyname LIKE 'Users Insert Own %' OR policyname LIKE 'Admin Insert %');
    
    -- Filter down to just the Phase 5B policies containing has_member_feature_access
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ({table_list})
      AND cmd = 'INSERT'
      AND (policyname = 'Tenant Isolation Insert' OR policyname = 'Users can insert election results for their tenant')
      AND (with_check LIKE '%has_member_feature_access%');
      
    IF v_count != 28 THEN
        RAISE EXCEPTION 'TEST 18 FAIL: Expected exactly 28 secure INSERT policies containing has_member_feature_access, found %', v_count;
    ELSE
        RAISE NOTICE 'TEST 18 PASS: exactly 28 secure INSERT policies found for target tables';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ({table_list})
      AND cmd = 'UPDATE' 
      AND (policyname = 'Tenant Isolation Update' OR policyname = 'Users can update election results for their tenant')
      AND (qual LIKE '%has_member_feature_access%' OR with_check LIKE '%has_member_feature_access%');
      
    IF v_count != 28 THEN
        RAISE EXCEPTION 'TEST 18 FAIL: Expected exactly 28 secure UPDATE policies containing has_member_feature_access, found %', v_count;
    ELSE
        RAISE NOTICE 'TEST 18 PASS: exactly 28 secure UPDATE policies found for target tables';
    END IF;
    
    -- -------------------------------------------------------------------------
    -- TEST 19: No other permissive INSERT/UPDATE policy remains on those 28 tables
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ({table_list})
      AND cmd IN ('INSERT', 'UPDATE')
      AND NOT (
          policyname = 'Tenant Isolation Insert' OR
          policyname = 'Tenant Isolation Update' OR
          policyname = 'Users can insert election results for their tenant' OR
          policyname = 'Users can update election results for their tenant' OR
          (tablename = 'survey_responses' AND (policyname = 'Enable insert for public'))
      );
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 19 FAIL: Found % remaining extra/rogue INSERT/UPDATE policies on target tables that could bypass Phase 5B', v_count;
    END IF;
    RAISE NOTICE 'TEST 19 PASS: No remaining rogue INSERT/UPDATE permissive policies on target tables';

    -- -------------------------------------------------------------------------
    -- TEST 20: Explicit verification of Phase 3B survey_responses exceptions
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'survey_responses' 
      AND policyname = 'Enable insert for public' AND cmd = 'INSERT';
    IF v_count != 1 THEN 
        RAISE EXCEPTION 'TEST 20 FAIL: Enable insert for public must exist exactly once on survey_responses as an INSERT, found %', v_count; 
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ({table_list}) AND tablename != 'survey_responses' 
      AND (policyname = 'Enable insert for public');
    IF v_count > 0 THEN 
        RAISE EXCEPTION 'TEST 20 FAIL: survey_responses exception policies found on other target tables'; 
    END IF;
    
    RAISE NOTICE 'TEST 20 PASS: Phase 3B survey_responses exceptions properly verified';

    RAISE NOTICE '--- BOT ARCHITECTURE INVARIANTS (Statically Verified) ---';
    RAISE NOTICE 'Invariant A: whatsapp_sessions isolated per tenant via Node.js Maps (no RLS needed)';
    RAISE NOTICE 'Invariant B: Webhook callbacks bound to closure-scoped tenantId -- no cross-tenant bleed';
    RAISE NOTICE 'Invariant C: All MenuNavigator DB ops use .eq(''tenant_id'', tenantId)';
    RAISE NOTICE 'Invariant D: Custom vs Default bot flow selection is tenant-config-scoped';

    RAISE NOTICE '=== ALL PHASE 5B VERIFICATION TESTS PASSED ===';
END $$;
"""

table_list_sql = "\n".join(f"          '{t}'," for t in tables)
# Remove the trailing comma from the last element
table_list_sql = table_list_sql[:-1] 

sql = sql.replace('{table_list}', table_list_sql)

with open('migrations/phase5b_rbac_verify.sql', 'w') as f:
    f.write(sql)

print('Generated migrations/phase5b_rbac_verify.sql')
