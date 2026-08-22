-- =============================================================================
-- PHASE 6 RBAC MIGRATION (CORRECTED)
-- DESCRIPTION: Implements strict Tenant/Unified policies for skipped tables
--              and drops legacy permissive SELECT/DELETE policies.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PREFLIGHT CHECKS & ASSERTIONS
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_has_feature_access_exists boolean;
    v_get_tenants_exists boolean;
    v_unified_count int;
    v_admin_secure boolean;
    v_audit_secure boolean;
BEGIN
    -- A. Verify required RBAC helper functions exist
    SELECT EXISTS(SELECT 1 FROM pg_proc JOIN pg_namespace n ON n.oid = pronamespace WHERE n.nspname = 'public' AND proname = 'has_member_feature_access') INTO v_has_feature_access_exists;
    SELECT EXISTS(SELECT 1 FROM pg_proc JOIN pg_namespace n ON n.oid = pronamespace WHERE n.nspname = 'public' AND proname = 'get_authorized_tenants') INTO v_get_tenants_exists;

    IF NOT v_has_feature_access_exists OR NOT v_get_tenants_exists THEN
        RAISE EXCEPTION 'PREFLIGHT FAILED: Required RBAC functions missing.';
    END IF;

    -- B. Verify all 8 exact Unified policies for area_problems and opposition_karyakartas exist
    SELECT COUNT(*) INTO v_unified_count
    FROM pg_policies
    WHERE (tablename = 'area_problems' AND policyname IN (
            'Unified Area Problems Select', 
            'Unified Area Problems Insert', 
            'Unified Area Problems Update', 
            'Unified Area Problems Delete'
          ))
       OR (tablename = 'opposition_karyakartas' AND policyname IN (
            'Unified Opposition Select', 
            'Unified Opposition Insert', 
            'Unified Opposition Update', 
            'Unified Opposition Delete'
          ));

    IF v_unified_count != 8 THEN
        RAISE EXCEPTION 'PREFLIGHT FAILED: Missing one or more exact Unified policies. Found exactly %, expected 8. Aborting to prevent access lockout.', v_unified_count;
    END IF;

    -- C. Verify Admin tables are secure (no anon/public)
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename IN ('admin_billing', 'admin_support_tickets', 'admin_updates', 'app_settings')
          AND roles::text IN ('{anon}', '{public}')
    ) INTO v_admin_secure;
    
    IF v_admin_secure THEN
        RAISE EXCEPTION 'PREFLIGHT FAILED: Admin tables contain anon/public policies.';
    END IF;

    -- D. Verify security_audit_logs is secure
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'security_audit_logs' AND policyname = 'Admins Select security_audit_logs'
    ) INTO v_audit_secure;

    IF NOT v_audit_secure THEN
        RAISE EXCEPTION 'PREFLIGHT FAILED: security_audit_logs Admins Select policy missing.';
    END IF;

    RAISE NOTICE 'PREFLIGHT PASSED: All safe-state assertions confirmed. Proceeding with legacy drops.';
END $$;

-- -----------------------------------------------------------------------------
-- 2. CREATE NEW UNIFIED POLICIES FOR SKIPPED TABLES
-- -----------------------------------------------------------------------------
-- NOTE: The 8 Unified policies (4 for area_problems, 4 for opposition_karyakartas)
-- were already created in the previous partial migration execution.
-- The preflight asserts their existence. No new CREATE POLICY statements are needed here.


-- -----------------------------------------------------------------------------
-- 3. DROP LEGACY/PERMISSIVE POLICIES
-- -----------------------------------------------------------------------------

-- Drop area_problems 8 legacy policies
DROP POLICY IF EXISTS "Tenant Delete area_problems" ON public.area_problems;
DROP POLICY IF EXISTS "Tenant Insert area_problems" ON public.area_problems;
DROP POLICY IF EXISTS "Tenant Select area_problems" ON public.area_problems;
DROP POLICY IF EXISTS "Tenant Update area_problems" ON public.area_problems;
DROP POLICY IF EXISTS "area_problems_tenant_isolation_del" ON public.area_problems;
DROP POLICY IF EXISTS "area_problems_tenant_isolation_ins" ON public.area_problems;
DROP POLICY IF EXISTS "area_problems_tenant_isolation_sel" ON public.area_problems;
DROP POLICY IF EXISTS "area_problems_tenant_isolation_upd" ON public.area_problems;

-- Drop opposition_karyakartas 8 legacy policies
DROP POLICY IF EXISTS "Tenant Delete opposition_karyakartas" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Tenant Insert opposition_karyakartas" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Tenant Select opposition_karyakartas" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Tenant Update opposition_karyakartas" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_del" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_ins" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_sel" ON public.opposition_karyakartas;
DROP POLICY IF EXISTS "Allow manage opposition karyakartas_upd" ON public.opposition_karyakartas;

-- Redundant drops for other public bypasses (already dropped in previous run, kept for idempotency)
DROP POLICY IF EXISTS "Allow public read voters" ON public.voters;
DROP POLICY IF EXISTS "Allow authenticated users to read incoming letters" ON public.incoming_letters;
DROP POLICY IF EXISTS "Enable all operations for admin_billing" ON public.admin_billing;
DROP POLICY IF EXISTS "Enable all operations for admin_support_tickets" ON public.admin_support_tickets;
DROP POLICY IF EXISTS "Enable all operations for admin_updates" ON public.admin_updates;
DROP POLICY IF EXISTS "Allow full access app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow public read events" ON public.events;
DROP POLICY IF EXISTS "Allow public read schemes" ON public.schemes;
DROP POLICY IF EXISTS "Allow public read improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow public read works" ON public.works;
DROP POLICY IF EXISTS "Allow public read ward_provisions" ON public.ward_provisions;
DROP POLICY IF EXISTS "Allow public read non_voters" ON public.non_voters;
DROP POLICY IF EXISTS "Allow anon read access" ON public.ai_history;
DROP POLICY IF EXISTS "Allow anon delete access" ON public.ai_history;
DROP POLICY IF EXISTS "Allow anon read access" ON public.gallery;
DROP POLICY IF EXISTS "Allow anon delete access" ON public.gallery;
DROP POLICY IF EXISTS "Allow public read of tenants" ON public.tenants;

COMMIT;
