-- =============================================================================
-- PHASE 26 BATCH 5: RLS VERIFICATION
-- Execution: Run in Supabase SQL Editor
-- Purpose: Verify tenant-isolated RLS for Batch 5 tables using simulated claims.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_tenant_a UUID := gen_random_uuid();
    v_tenant_b UUID := gen_random_uuid();
    v_user_a UUID := gen_random_uuid();
    v_user_b UUID := gen_random_uuid();
    
    v_item_a TEXT;
    v_item_b TEXT;
    v_count INT;
    v_policy_exists BOOLEAN;
    v_index_exists BOOLEAN;
    t_name TEXT;
    f_key TEXT;
    
    -- Table specific insert statements for mock data
    v_insert_sql TEXT;
BEGIN
    RAISE NOTICE '=== STARTING PHASE 26 BATCH 5 VERIFICATION ===';

    ----------------------------------------------------------------------------
    -- 1. SETUP MOCK DATA (Bypassing RLS as Superuser)
    ----------------------------------------------------------------------------
    INSERT INTO auth.users (id, aud, role, email) VALUES
        (v_user_a, 'authenticated', 'authenticated', 'mockA5@example.com'),
        (v_user_b, 'authenticated', 'authenticated', 'mockB5@example.com');

    INSERT INTO public.tenants (id, name, subdomain, plan) VALUES 
        (v_tenant_a, 'Verify Tenant A', 'verify-a5', 'advance'),
        (v_tenant_b, 'Verify Tenant B', 'verify-b5', 'advance');

    INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role) VALUES 
        (v_user_a, v_tenant_a, 'admin'),
        (v_user_b, v_tenant_b, 'admin');

    -- Ensure features exist for Batch 5 using features.feature_key
    -- Do not insert duplicate features, just ensure they are active if they exist.
    -- Or rather, only insert if they do not exist.
    INSERT INTO public.features (id, feature_key, name, is_active)
    VALUES 
        (gen_random_uuid(), 'ai_content', 'AI Content Studio', true),
        (gen_random_uuid(), 'social_organizations', 'NGO & Mandals Info', true),
        (gen_random_uuid(), 'housing_societies', 'Society Chairman Directory', true),
        (gen_random_uuid(), 'gallery', 'Photo Gallery', true),
        (gen_random_uuid(), 'budget', 'Budget Provisions', true),
        (gen_random_uuid(), 'gb_register', 'Daily Diary', true)
    ON CONFLICT (feature_key) DO UPDATE SET is_active = EXCLUDED.is_active;

    INSERT INTO public.tenant_feature_overrides (tenant_id, feature_id, is_enabled)
    SELECT t.id, f.id, true
    FROM public.tenants t CROSS JOIN public.features f
    WHERE t.id IN (v_tenant_a, v_tenant_b) 
      AND f.feature_key IN ('ai_content', 'social_organizations', 'housing_societies', 'gallery', 'budget', 'gb_register');

    ----------------------------------------------------------------------------
    -- 2. PROVE AUTHORIZATION FIXTURE IS VALID
    ----------------------------------------------------------------------------
    -- Switch to authenticated role and mock the JWT claims for User A
    SET LOCAL role = 'authenticated';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a)::text, true);

    -- Prove get_authorized_tenants() returns v_tenant_a
    IF NOT EXISTS (SELECT 1 FROM public.get_authorized_tenants() WHERE get_authorized_tenants = v_tenant_a) THEN
        RAISE EXCEPTION 'Fixture Failure: get_authorized_tenants() did not return Tenant A';
    END IF;

    -- Prove has_member_feature_access() returns true for all features
    FOREACH f_key IN ARRAY ARRAY['ai_content', 'social_organizations', 'housing_societies', 'gallery', 'budget', 'gb_register']
    LOOP
        IF NOT public.has_member_feature_access(v_tenant_a, v_user_a, f_key) THEN
            RAISE EXCEPTION 'Fixture Failure: has_member_feature_access(Tenant A, User A, %) returned FALSE', f_key;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Authorization Fixtures Proved Successful';

    ----------------------------------------------------------------------------
    -- 3. VERIFY POLICIES, INDEXES, AND RLS FOR ALL TABLES
    ----------------------------------------------------------------------------
    FOREACH t_name IN ARRAY ARRAY['ai_history', 'social_organizations', 'housing_societies', 'gallery', 'ward_provisions', 'gb_diary']
    LOOP
        RAISE NOTICE '---------------------------------------------------';
        RAISE NOTICE 'Verifying Table: %', t_name;
        
        -- Switch to postgres role to run catalog checks and initial inserts
        SET LOCAL role = 'postgres';
        

        -- 12. RLS is explicitly ENABLED
        SELECT relrowsecurity INTO v_policy_exists
        FROM pg_class
        WHERE relname = t_name;
        
        IF NOT v_policy_exists THEN RAISE EXCEPTION '❌ FAIL: RLS is NOT enabled on %', t_name; END IF;
        
        -- 10. RLS policies exist.

        SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t_name AND (cmd = 'SELECT' OR cmd = 'ALL')) INTO v_policy_exists;
        IF NOT v_policy_exists THEN RAISE EXCEPTION '❌ FAIL: Missing Select Policy for %', t_name; END IF;
        
        -- 11. Tenant indexes exist.
        SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = t_name AND indexdef ILIKE '%tenant_id%') INTO v_index_exists;
        IF NOT v_index_exists THEN RAISE EXCEPTION '❌ FAIL: Missing Tenant Index for %', t_name; END IF;
        
        RAISE NOTICE '✅ 10 & 11: Policies and Indexes exist';

        -- Generate specific mock data based on table constraints
        IF t_name = 'ward_provisions' THEN
            v_item_a := (floor(random() * 1000000) + 1000000)::text;
            v_item_b := (floor(random() * 1000000) + 2000000)::text;
        ELSE
            v_item_a := (CASE WHEN t_name = 'ward_provisions' THEN (floor(random() * 1000000) + 3000000)::text ELSE gen_random_uuid()::text END)::text;
            v_item_b := (CASE WHEN t_name = 'ward_provisions' THEN (floor(random() * 1000000) + 3000000)::text ELSE gen_random_uuid()::text END)::text;
        END IF;
        
        IF t_name = 'ai_history' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, title, content_type, generated_content) VALUES (%%L, %%L, ''AI'', ''Speech'', ''content'')', t_name);
        ELSIF t_name = 'social_organizations' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, name, type) VALUES (%%L, %%L, ''Org'', ''ngo'')', t_name);
        ELSIF t_name = 'housing_societies' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, name) VALUES (%%L, %%L, ''Society'')', t_name);
        ELSIF t_name = 'gallery' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, title, category, image_url) VALUES (%%L, %%L, ''Gal'', ''Event'', ''url'')', t_name);
        ELSIF t_name = 'ward_provisions' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, title, financial_year, category, requested_amount) VALUES (%%L, %%L, ''Prov'', ''2024-2025'', ''Road'', 1000)', t_name);
        ELSIF t_name = 'gb_diary' THEN
            v_insert_sql := format('INSERT INTO public.%I (id, tenant_id, subject, meeting_date) VALUES (%%L, %%L, ''Diary'', now())', t_name);
        END IF;
        
        -- Insert as superuser
        EXECUTE format(v_insert_sql, v_item_a, v_tenant_a);
        EXECUTE format(v_insert_sql, v_item_b, v_tenant_b);

        -- Switch to authenticated user A
        SET LOCAL role = 'authenticated';
        PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a)::text, true);

        -- 1. Same-tenant SELECT works.
        EXECUTE format('SELECT count(*) FROM public.%I WHERE id = %L', t_name, v_item_a) INTO v_count;
        IF v_count = 1 THEN RAISE NOTICE '✅ 1. Same-tenant SELECT works';
        ELSE RAISE EXCEPTION '❌ FAIL: Same-tenant SELECT returned % rows', v_count; END IF;

        -- 2. Cross-tenant SELECT returns zero.
        EXECUTE format('SELECT count(*) FROM public.%I WHERE id = %L', t_name, v_item_b) INTO v_count;
        IF v_count = 0 THEN RAISE NOTICE '✅ 2. Cross-tenant SELECT returns zero';
        ELSE RAISE EXCEPTION '❌ FAIL: Cross-tenant SELECT returned % rows', v_count; END IF;

        -- 3. Same-tenant INSERT works.
        EXECUTE format(v_insert_sql, (CASE WHEN t_name = 'ward_provisions' THEN (floor(random() * 1000000) + 3000000)::text ELSE gen_random_uuid()::text END), v_tenant_a);
        RAISE NOTICE '✅ 3. Same-tenant INSERT works';

        -- 4. Cross-tenant INSERT is rejected.
        BEGIN
            EXECUTE format(v_insert_sql, (CASE WHEN t_name = 'ward_provisions' THEN (floor(random() * 1000000) + 3000000)::text ELSE gen_random_uuid()::text END), v_tenant_b);
            RAISE EXCEPTION '❌ FAIL: Cross-tenant INSERT was not rejected!';
        EXCEPTION WHEN with_check_option_violation OR insufficient_privilege THEN
            RAISE NOTICE 'Caught RLS error: %', SQLERRM;
            RAISE NOTICE '✅ 4. Cross-tenant INSERT is rejected (RLS Error)'; 
        END;

        -- 5. Same-tenant UPDATE works.
        EXECUTE format('UPDATE public.%I SET id = id WHERE id = %L', t_name, v_item_a);
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count = 1 THEN RAISE NOTICE '✅ 5. Same-tenant UPDATE works';
        ELSE RAISE EXCEPTION '❌ FAIL: Same-tenant UPDATE affected % rows', v_count; END IF;

        -- 6. Cross-tenant UPDATE affects zero rows.
        EXECUTE format('UPDATE public.%I SET id = id WHERE id = %L', t_name, v_item_b);
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count = 0 THEN RAISE NOTICE '✅ 6. Cross-tenant UPDATE affects zero rows';
        ELSE RAISE EXCEPTION '❌ FAIL: Cross-tenant UPDATE affected % rows', v_count; END IF;

        -- 7. tenant_id mutation is rejected.
        BEGIN
            EXECUTE format('UPDATE public.%I SET tenant_id = %L WHERE id = %L', t_name, v_tenant_b, v_item_a);
            RAISE EXCEPTION '❌ FAIL: tenant_id mutation was not rejected!';
        EXCEPTION WHEN with_check_option_violation OR insufficient_privilege THEN
            RAISE NOTICE 'Caught RLS error: %', SQLERRM;
            RAISE NOTICE '✅ 7. tenant_id mutation is rejected (RLS Error)'; 
        END;

        -- 9. Cross-tenant DELETE affects zero rows.
        EXECUTE format('DELETE FROM public.%I WHERE id = %L', t_name, v_item_b);
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count = 0 THEN RAISE NOTICE '✅ 9. Cross-tenant DELETE affects zero rows';
        ELSE RAISE EXCEPTION '❌ FAIL: Cross-tenant DELETE affected % rows', v_count; END IF;

        -- 8. Same-tenant DELETE works.
        EXECUTE format('DELETE FROM public.%I WHERE id = %L', t_name, v_item_a);
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count = 1 THEN RAISE NOTICE '✅ 8. Same-tenant DELETE works';
        ELSE RAISE EXCEPTION '❌ FAIL: Same-tenant DELETE affected % rows', v_count; END IF;

    END LOOP;

    RAISE NOTICE '=== BATCH 5 VERIFICATION COMPLETED FULLY ===';

END $$;

ROLLBACK;
