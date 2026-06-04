-- SQL script to map testing accounts as super_admin to bypass RLS tenant isolation.
-- Run this in your Supabase SQL Editor.

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID := 'bf1a3e36-464e-4eff-b21d-dc71f5a5a582'; -- Krishna Niti tenant ID
BEGIN
    -- Ensure Krishna Niti tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = v_tenant_id) THEN
        -- Fallback to first tenant in the database if the specified one doesn't exist
        SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenants found in public.tenants table. Please create a tenant first.';
    END IF;

    -- 1. Map krishnaniti@gmail.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'krishnaniti@gmail.com';
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.user_tenant_mapping WHERE user_id = v_user_id;
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, v_tenant_id, 'super_admin');
        RAISE NOTICE 'Linked krishnaniti@gmail.com as super_admin to tenant %', v_tenant_id;
    ELSE
        RAISE NOTICE 'User krishnaniti@gmail.com not found in auth.users';
    END IF;

    -- 2. Map krishnaniti123@gmail.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'krishnaniti123@gmail.com';
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.user_tenant_mapping WHERE user_id = v_user_id;
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, v_tenant_id, 'super_admin');
        RAISE NOTICE 'Linked krishnaniti123@gmail.com as super_admin to tenant %', v_tenant_id;
    ELSE
        RAISE NOTICE 'User krishnaniti123@gmail.com not found in auth.users';
    END IF;
END $$;
