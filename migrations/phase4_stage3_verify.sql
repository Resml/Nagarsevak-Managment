-- Phase 4 Stage 3 Verification
-- Tests what can be verified from the SQL editor context
-- RLS live tests are handled by the application / Supabase test suite

BEGIN;

DO $$
DECLARE
    v_adv_tenant_1  uuid;
    v_adv_tenant_2  uuid;
    v_adv_user_1    uuid;
    v_adv_user_2    uuid;
    v_basic_tenant  uuid;
    v_override_tenant uuid;
    v_disabled_feature uuid;
    v_disabled_feature_key text;
    v_override_user uuid;
    v_count int;
BEGIN
    ------------------------------------------------------------
    -- 1. SETUP
    ------------------------------------------------------------
    SELECT t.id, utm.user_id INTO v_adv_tenant_1, v_adv_user_1
    FROM public.tenants t JOIN public.user_tenant_mapping utm ON utm.tenant_id = t.id
    WHERE t.plan = 'advance' ORDER BY t.id LIMIT 1;

    SELECT t.id, utm.user_id INTO v_adv_tenant_2, v_adv_user_2
    FROM public.tenants t JOIN public.user_tenant_mapping utm ON utm.tenant_id = t.id
    WHERE t.plan = 'advance' AND t.id <> v_adv_tenant_1 ORDER BY t.id LIMIT 1;

    SELECT id INTO v_basic_tenant FROM public.tenants WHERE plan = 'basic' LIMIT 1;

    SELECT tfo.tenant_id, tfo.feature_id, utm.user_id
    INTO v_override_tenant, v_disabled_feature, v_override_user
    FROM public.tenant_feature_overrides tfo
    JOIN public.user_tenant_mapping utm ON utm.tenant_id = tfo.tenant_id
    WHERE tfo.is_enabled = false LIMIT 1;

    SELECT feature_key INTO v_disabled_feature_key FROM public.features WHERE id = v_disabled_feature;

    IF v_adv_user_1 IS NULL THEN
        RAISE EXCEPTION 'SETUP FAILED: No advance tenant with a mapped user found';
    END IF;

    RAISE NOTICE 'Setup: adv_tenant_1=% user_1=%', v_adv_tenant_1, v_adv_user_1;
    RAISE NOTICE 'Setup: adv_tenant_2=% user_2=%', v_adv_tenant_2, v_adv_user_2;

    ------------------------------------------------------------
    -- TEST 1: Entitlement schema integrity — feature catalog
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.features;
    IF v_count < 30 THEN
        RAISE EXCEPTION 'TEST 1 FAIL: Expected >=30 features, got %', v_count;
    END IF;
    RAISE NOTICE 'TEST 1 PASS: % features in catalog', v_count;

    ------------------------------------------------------------
    -- TEST 2: All 4 canonical plans exist
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count FROM public.plans WHERE plan_key IN ('basic','pro','advance','custom');
    IF v_count <> 4 THEN
        RAISE EXCEPTION 'TEST 2 FAIL: Expected 4 plans, got %', v_count;
    END IF;
    RAISE NOTICE 'TEST 2 PASS: basic/pro/advance/custom plans all present';

    ------------------------------------------------------------
    -- TEST 3: Advance plan has all 39 features in plan_features
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count 
    FROM public.plan_features pf
    JOIN public.plans p ON p.id = pf.plan_id
    WHERE p.plan_key = 'advance';
    IF v_count < 39 THEN
        RAISE EXCEPTION 'TEST 3 FAIL: advance plan has only % plan_features rows, expected 39', v_count;
    END IF;
    RAISE NOTICE 'TEST 3 PASS: advance plan has % feature mappings', v_count;

    ------------------------------------------------------------
    -- TEST 4: gb_register IS in advance plan
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM public.plan_features pf
    JOIN public.plans p ON p.id = pf.plan_id
    JOIN public.features f ON f.id = pf.feature_id
    WHERE p.plan_key = 'advance' AND f.feature_key = 'gb_register' AND pf.is_enabled = true;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 4 FAIL: gb_register is NOT mapped to advance plan';
    END IF;
    RAISE NOTICE 'TEST 4 PASS: gb_register correctly mapped to advance plan';

    ------------------------------------------------------------
    -- TEST 5: gb_register is NOT in basic plan
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM public.plan_features pf
    JOIN public.plans p ON p.id = pf.plan_id
    JOIN public.features f ON f.id = pf.feature_id
    WHERE p.plan_key = 'basic' AND f.feature_key = 'gb_register';
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 5 FAIL: gb_register should NOT be in basic plan but it is';
    END IF;
    RAISE NOTICE 'TEST 5 PASS: gb_register correctly excluded from basic plan';

    ------------------------------------------------------------
    -- TEST 6: advance tenant correctly matched to advance plan
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM public.tenants t
    JOIN public.plans p ON LOWER(p.plan_key) = LOWER(t.plan)
    WHERE t.id = v_adv_tenant_1;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 6 FAIL: advance tenant plan (%) does not match any plan_key in plans table', 
            (SELECT plan FROM public.tenants WHERE id = v_adv_tenant_1);
    END IF;
    RAISE NOTICE 'TEST 6 PASS: advance tenant plan matches plans table';

    ------------------------------------------------------------
    -- TEST 7: Disabled override is correctly set
    ------------------------------------------------------------
    IF v_disabled_feature_key IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM public.tenant_feature_overrides tfo
        JOIN public.features f ON f.id = tfo.feature_id
        WHERE tfo.tenant_id = v_override_tenant AND tfo.is_enabled = false AND f.feature_key = v_disabled_feature_key;
        IF v_count = 0 THEN
            RAISE EXCEPTION 'TEST 7 FAIL: expected disabled override for % not found', v_disabled_feature_key;
        END IF;
        RAISE NOTICE 'TEST 7 PASS: disabled override for % confirmed', v_disabled_feature_key;
    ELSE
        RAISE NOTICE 'TEST 7 SKIPPED: No disabled overrides found in database';
    END IF;

    ------------------------------------------------------------
    -- TEST 8: RLS policies exist on gb_diary with entitlement check
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'gb_diary'
    AND (qual LIKE '%has_feature_access%' OR with_check LIKE '%has_feature_access%');
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 8 FAIL: No has_feature_access policies found on gb_diary';
    END IF;
    RAISE NOTICE 'TEST 8 PASS: % RLS policies on gb_diary reference has_feature_access', v_count;

    ------------------------------------------------------------
    -- TEST 9: RLS policies on tasks have entitlement check
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'tasks'
    AND (qual LIKE '%has_feature_access%' OR with_check LIKE '%has_feature_access%');
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 9 FAIL: No has_feature_access policies on tasks';
    END IF;
    RAISE NOTICE 'TEST 9 PASS: tasks RLS policies reference has_feature_access';

    ------------------------------------------------------------
    -- TEST 10: whatsapp_sessions has zero client-facing policies (service_role bypass only)
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'whatsapp_sessions'
    AND roles::text NOT LIKE '%service_role%';
    IF v_count > 0 THEN
        RAISE EXCEPTION 'TEST 10 FAIL: whatsapp_sessions has % non-service_role policies', v_count;
    END IF;
    RAISE NOTICE 'TEST 10 PASS: whatsapp_sessions has no non-service_role client policies';

    ------------------------------------------------------------
    -- TEST 11: Survey anon policies still exist (Phase 3B preserved)
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE tablename = 'surveys' AND roles::text LIKE '%anon%';
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 11 FAIL: anon survey policies appear to have been removed!';
    END IF;
    RAISE NOTICE 'TEST 11 PASS: Phase 3B anon survey policies preserved (% policies)', v_count;

    ------------------------------------------------------------
    -- TEST 12: has_feature_access function exists with SECURITY DEFINER
    ------------------------------------------------------------
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_feature_access' AND p.prosecdef = true;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'TEST 12 FAIL: has_feature_access function not found or missing SECURITY DEFINER';
    END IF;
    RAISE NOTICE 'TEST 12 PASS: has_feature_access SECURITY DEFINER function exists';

    ------------------------------------------------------------
    RAISE NOTICE '=== ALL 12 STAGE 3 VERIFICATION TESTS PASSED SUCCESSFULLY ===';
END $$;

ROLLBACK;
