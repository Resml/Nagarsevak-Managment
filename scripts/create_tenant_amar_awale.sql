-- ==============================================================
-- CREATE NEW TENANT: Amar Awale
-- Plan: ADVANCE | Tier: NAGARSEVAK | Subdomain: amarawale
-- Auth User UUID: 8173f741-bef7-4c78-bf61-603f524338ff
--
-- Tables written:
--   1. public.tenants          → 1 new row
--   2. public.user_tenant_mapping → 1 new row
--
-- Tables NOT touched:
--   - All existing tenant rows (krishnaniti, mamit, etc.)
--   - voters, complaints, letters, visitors, surveys, staff,
--     whatsapp_sessions, election_results, or any other data table
--
-- Contains NO passwords, NO service role key, NO credentials.
-- ==============================================================

DO $$
DECLARE
    v_new_tenant_id  uuid;
    v_user_id        uuid := '8173f741-bef7-4c78-bf61-603f524338ff';
    v_subdomain      text := 'amarawale';
    v_name           text := 'Amar Awale';
    v_tier           text := 'nagarsevak';
    v_plan           text := 'advance';
BEGIN

    -- ── GUARD 1: Subdomain must not already exist ──────────────────────
    IF EXISTS (
        SELECT 1 FROM public.tenants WHERE subdomain = v_subdomain
    ) THEN
        RAISE EXCEPTION
            'ABORT: A tenant with subdomain "%" already exists. Halting.',
            v_subdomain;
    END IF;

    -- ── GUARD 2: This auth user must not already have a tenant mapping ─
    IF EXISTS (
        SELECT 1 FROM public.user_tenant_mapping WHERE user_id = v_user_id
    ) THEN
        RAISE EXCEPTION
            'ABORT: Auth user % already has a tenant mapping. Halting.',
            v_user_id;
    END IF;

    -- ── GUARD 3: Verify existing critical tenants are untouched ────────
    --    (Read-only sanity check before writing anything)
    IF NOT EXISTS (
        SELECT 1 FROM public.tenants
        WHERE subdomain = 'krishnaniti'
          AND plan = 'advance'
    ) THEN
        RAISE EXCEPTION
            'ABORT: Krishnaniti tenant integrity check failed. Halting.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.tenants
        WHERE subdomain = 'mamit'
          AND plan = 'advance'
    ) THEN
        RAISE EXCEPTION
            'ABORT: Mamit tenant integrity check failed. Halting.';
    END IF;

    -- ── STEP 1: Create the new tenant row ─────────────────────────────
    INSERT INTO public.tenants (
        name,
        subdomain,
        tier,
        plan,
        config
    )
    VALUES (
        v_name,
        v_subdomain,
        v_tier,
        v_plan,
        jsonb_build_object(
            'nagarsevak_name_english', v_name,
            'nagarsevak_name_marathi', v_name,
            'email_address',           'amar@gmail.com',
            'designation',             'Nagarsevak',
            'office',                  'Amar Awale Office',
            'ward',                    '',
            'constituency',            '',
            'disabled_features',       '[]'::jsonb
        )
    )
    RETURNING id INTO v_new_tenant_id;

    RAISE NOTICE '[STEP 1] ✅ Tenant created: "%" | ID: % | tier: % | plan: %',
        v_name, v_new_tenant_id, v_tier, v_plan;

    -- ── STEP 2: Map auth user → new tenant (admin role) ───────────────
    INSERT INTO public.user_tenant_mapping (
        user_id,
        tenant_id,
        role
    )
    VALUES (
        v_user_id,
        v_new_tenant_id,
        'admin'
    );

    RAISE NOTICE '[STEP 2] ✅ User % mapped to tenant % as role=admin',
        v_user_id, v_new_tenant_id;

    -- ── FINAL NOTICE ───────────────────────────────────────────────────
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE 'NEW TENANT CREATED SUCCESSFULLY';
    RAISE NOTICE '  Tenant ID  : %', v_new_tenant_id;
    RAISE NOTICE '  Name       : %', v_name;
    RAISE NOTICE '  Subdomain  : %', v_subdomain;
    RAISE NOTICE '  Tier       : %', v_tier;
    RAISE NOTICE '  Plan       : %', v_plan;
    RAISE NOTICE '  User UUID  : %', v_user_id;
    RAISE NOTICE '  Role       : admin';
    RAISE NOTICE '══════════════════════════════════════════════════════';

END $$;
