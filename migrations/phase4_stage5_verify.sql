-- Phase 4 Stage 5 Verify: Ensure Legacy Columns are Dropped

DO $$
DECLARE
    col_count INT;
    domain_col_count INT;
    func_count INT;
    global_table_count INT;
    policy_ref_count INT;
    isolation_count INT;
BEGIN
    -- 1. Check that 'plan' column does NOT exist on any target table
    SELECT count(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'plan'
    AND table_name IN (
        'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events', 
        'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters', 
        'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests', 
        'sadasya', 'schemes', 'social_organizations', 'staff', 'survey_responses', 
        'surveys', 'tasks', 'visitors', 'voter_applications', 'voters', 
        'ward_provisions', 'work_trackers', 'works'
    );

    IF col_count > 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: "plan" column still exists on % target tables', col_count;
    END IF;

    -- 2. Check that 'category' column does NOT exist on the 22 non-domain target tables
    SELECT count(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'category'
    AND table_name IN (
        'ai_history', 'election_results', 'event_rsvps', 'events', 
        'gb_diary', 'housing_societies', 'improvements', 'incoming_letters', 
        'letter_requests', 'letter_types', 'message_logs', 'non_voters', 
        'sadasya', 'social_organizations', 'survey_responses', 
        'surveys', 'tasks', 'visitors', 'voter_applications', 'voters', 
        'work_trackers', 'works'
    );

    IF col_count > 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: "category" column still exists on % non-domain target tables', col_count;
    END IF;

    -- 3. Check that 'category' column STILL EXISTS on the 6 domain target tables
    SELECT count(*) INTO domain_col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'category'
    AND table_name IN (
        'complaints', 'gallery', 'personal_requests', 'schemes', 'staff', 'ward_provisions'
    );

    IF domain_col_count < 6 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Expected 6 domain "category" columns to be preserved, found %', domain_col_count;
    END IF;

    -- 4. Check that tenants.plan and tenants.tier exist
    SELECT count(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name IN ('plan', 'tier');

    IF col_count < 2 THEN
        RAISE EXCEPTION 'VERIFY FAIL: tenants.plan or tenants.tier is missing';
    END IF;

    -- 5. Check that has_feature_access() exists
    SELECT count(*) INTO func_count
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_namespace.nspname = 'public' AND proname = 'has_feature_access';

    IF func_count = 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: has_feature_access() function is missing';
    END IF;

    -- 6. Check that features, plans, plan_features, tenant_feature_overrides exist
    SELECT count(*) INTO global_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('features', 'plans', 'plan_features', 'tenant_feature_overrides');

    IF global_table_count < 4 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Expected 4 feature management tables, found %', global_table_count;
    END IF;

    -- 7. Check that no RLS policy references child-table plan/category columns
    SELECT count(*) INTO policy_ref_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('tenants', 'features', 'plans', 'plan_features', 'tenant_feature_overrides')
    AND (
        qual ILIKE '%plan = %' OR qual ILIKE '%category = %' OR 
        with_check ILIKE '%plan = %' OR with_check ILIKE '%category = %'
    );

    IF policy_ref_count > 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Found % RLS policies still referencing plan/category', policy_ref_count;
    END IF;

    -- 8. Verify Phase 2 Tenant Isolation is still present
    SELECT count(*) INTO isolation_count
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname ILIKE '%Tenant Isolation%';

    IF isolation_count = 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Phase 2 Tenant Isolation policies are missing';
    END IF;

    -- 9. Verify Phase 3 Storage RLS is still present
    SELECT count(*) INTO isolation_count
    FROM pg_policies
    WHERE schemaname = 'storage' AND policyname ILIKE '%Tenant Isolation%';

    IF isolation_count = 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Phase 3 Storage RLS policies are missing';
    END IF;

    -- 10. Verify Phase 3B public policies remain present
    SELECT count(*) INTO isolation_count
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname ILIKE '%Public%';

    IF isolation_count = 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: Phase 3B Public Intake policies are missing';
    END IF;

    -- 11. Verify whatsapp_sessions remains locked
    SELECT count(*) INTO isolation_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'whatsapp_sessions';

    IF isolation_count = 0 THEN
        RAISE EXCEPTION 'VERIFY FAIL: whatsapp_sessions policies are missing';
    END IF;

    RAISE NOTICE 'VERIFY PASS: Phase 4 Stage 5 legacy drops and invariants verified successfully.';
END $$;
