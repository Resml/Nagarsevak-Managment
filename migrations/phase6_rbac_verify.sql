-- =============================================================================
-- PHASE 6 RBAC VERIFIER (CORRECTED)
-- DESCRIPTION: Accumulates test results into public.phase6_verify_results
--              Validates no permissive policy bypasses exist.
-- =============================================================================

-- Ensure clean results table
DROP TABLE IF EXISTS public.phase6_verify_results;
CREATE TABLE public.phase6_verify_results (
    test_number INT PRIMARY KEY,
    status TEXT,
    message TEXT
);

DO $$
DECLARE
    v_count INT;
    v_has_bypass BOOLEAN;
BEGIN
    ----------------------------------------------------------------------------
    -- TEST 1: area_problems Unified Policies
    ----------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'area_problems'
      AND policyname LIKE 'Unified Area Problems %'
      AND (
        (cmd IN ('SELECT', 'DELETE') AND qual LIKE '%has_member_feature_access%ward_problems%' AND qual LIKE '%get_authorized_tenants()%') OR
        (cmd = 'INSERT' AND with_check LIKE '%has_member_feature_access%ward_problems%' AND with_check LIKE '%get_authorized_tenants()%') OR
        (cmd = 'UPDATE' AND qual LIKE '%has_member_feature_access%ward_problems%' AND qual LIKE '%get_authorized_tenants()%' AND with_check LIKE '%has_member_feature_access%ward_problems%' AND with_check LIKE '%get_authorized_tenants()%')
      );

    IF v_count = 4 THEN
        INSERT INTO public.phase6_verify_results VALUES (1, 'PASS', 'area_problems has exactly 4 Unified feature-restricted policies.');
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (1, 'FAIL', 'area_problems missing or malformed Unified policies. Found: ' || v_count);
    END IF;

    ----------------------------------------------------------------------------
    -- TEST 2: opposition_karyakartas Unified Policies
    ----------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'opposition_karyakartas'
      AND policyname LIKE 'Unified Opposition %'
      AND (
        (cmd IN ('SELECT', 'DELETE') AND qual LIKE '%has_member_feature_access%opposition%' AND qual LIKE '%get_authorized_tenants()%') OR
        (cmd = 'INSERT' AND with_check LIKE '%has_member_feature_access%opposition%' AND with_check LIKE '%get_authorized_tenants()%') OR
        (cmd = 'UPDATE' AND qual LIKE '%has_member_feature_access%opposition%' AND qual LIKE '%get_authorized_tenants()%' AND with_check LIKE '%has_member_feature_access%opposition%' AND with_check LIKE '%get_authorized_tenants()%')
      );

    IF v_count = 4 THEN
        INSERT INTO public.phase6_verify_results VALUES (2, 'PASS', 'opposition_karyakartas has exactly 4 Unified feature-restricted policies.');
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (2, 'FAIL', 'opposition_karyakartas missing or malformed Unified policies. Found: ' || v_count);
    END IF;

    ----------------------------------------------------------------------------
    -- TEST 3: Legacy Bypasses Removal
    ----------------------------------------------------------------------------
    -- Ensure 0 legacy policies exist on area_problems and opposition_karyakartas
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename IN ('area_problems', 'opposition_karyakartas')
      AND policyname NOT LIKE 'Unified %';

    IF v_count = 0 THEN
        INSERT INTO public.phase6_verify_results VALUES (3, 'PASS', 'No legacy permissive bypass policies exist on area_problems or opposition_karyakartas.');
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (3, 'FAIL', 'Found ' || v_count || ' legacy bypass policies on area_problems or opposition_karyakartas.');
    END IF;

    ----------------------------------------------------------------------------
    -- TEST 4: Admin Tables Strict Lockdown (Grants & RLS)
    ----------------------------------------------------------------------------
    -- Check for anon/public access
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename IN ('admin_billing', 'admin_support_tickets', 'admin_updates', 'app_settings')
          AND roles::text IN ('{anon}', '{public}')
    ) INTO v_has_bypass;

    IF v_has_bypass THEN
        INSERT INTO public.phase6_verify_results VALUES (4, 'FAIL', 'Admin tables contain anon/public policies.');
    ELSE
        -- Verify that authenticated policies strictly check for super_admin
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename IN ('admin_billing', 'admin_support_tickets', 'admin_updates', 'app_settings')
              AND roles::text = '{authenticated}'
              AND qual NOT LIKE '%role = ''super_admin''%'
        ) INTO v_has_bypass;

        IF v_has_bypass THEN
            INSERT INTO public.phase6_verify_results VALUES (4, 'FAIL', 'Admin tables contain unrestricted authenticated policies.');
        ELSE
            -- Verify RLS is enabled on all 4
            SELECT COUNT(*) INTO v_count
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname IN ('admin_billing', 'admin_support_tickets', 'admin_updates', 'app_settings')
              AND n.nspname = 'public'
              AND c.relrowsecurity = true;
              
            IF v_count = 4 THEN
                INSERT INTO public.phase6_verify_results VALUES (4, 'PASS', 'Admin tables successfully locked down to service_role and super_admin, RLS enabled.');
            ELSE
                INSERT INTO public.phase6_verify_results VALUES (4, 'FAIL', 'Admin tables missing RLS protection.');
            END IF;
        END IF;
    END IF;

    ----------------------------------------------------------------------------
    -- TEST 5: Tenants Duplicate Removal
    ----------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'tenants' AND cmd = 'SELECT' AND roles::text = '{public}';

    IF v_count = 1 THEN
        INSERT INTO public.phase6_verify_results VALUES (5, 'PASS', 'Tenants has exactly 1 public SELECT policy.');
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (5, 'FAIL', 'Tenants public SELECT count != 1. Found: ' || v_count);
    END IF;

    ----------------------------------------------------------------------------
    -- TEST 6: Security Audit Logs Verification
    ----------------------------------------------------------------------------
    -- We verify Admins Select exists, and Auth Insert exists with get_authorized_tenants()
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'security_audit_logs' AND policyname = 'Admins Select security_audit_logs'
    ) INTO v_has_bypass; -- Reusing boolean for existence

    IF v_has_bypass THEN
        SELECT COUNT(*) INTO v_count
        FROM pg_policies
        WHERE tablename = 'security_audit_logs' 
          AND policyname = 'Auth Insert security_audit_logs'
          AND with_check LIKE '%get_authorized_tenants()%';

        IF v_count = 1 THEN
            INSERT INTO public.phase6_verify_results VALUES (6, 'PASS', 'Security audit logs correctly secured with Admins Select and Auth Insert.');
        ELSE
            INSERT INTO public.phase6_verify_results VALUES (6, 'FAIL', 'Security audit logs Auth Insert policy missing or malformed.');
        END IF;
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (6, 'FAIL', 'Security audit logs Admins Select policy missing.');
    END IF;

    ----------------------------------------------------------------------------
    -- FINAL VERDICT
    ----------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.phase6_verify_results WHERE status = 'FAIL';

    IF v_count = 0 THEN
        INSERT INTO public.phase6_verify_results VALUES (999, 'PASS', 'PHASE 6 VERIFICATION PASSED COMPLETELY.');
    ELSE
        INSERT INTO public.phase6_verify_results VALUES (999, 'FAIL', 'PHASE 6 VERIFICATION FAILED. Check test results.');
    END IF;

END $$;

-- DISPLAY RESULTS
SELECT * FROM public.phase6_verify_results ORDER BY test_number ASC;
