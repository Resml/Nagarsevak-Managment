-- SQL script to map testing accounts to the correct tenant (bf4c7152-6006-41b5-9c7d-84c76ea67da4) where your old data exists.
-- Run this in your Supabase SQL Editor.

DO $$
DECLARE
    v_user_id UUID;
    v_target_tenant_id UUID := 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'; -- Tenant with all your old complaints/voters data
BEGIN
    -- 1. Map krishnaniti@gmail.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'krishnaniti@gmail.com';
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.user_tenant_mapping WHERE user_id = v_user_id;
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, v_target_tenant_id, 'super_admin');
        RAISE NOTICE 'Mapped krishnaniti@gmail.com to tenant bf4c7152-6006-41b5-9c7d-84c76ea67da4 as super_admin';
    ELSE
        RAISE NOTICE 'User krishnaniti@gmail.com not found in auth.users';
    END IF;

    -- 2. Map krishnaniti123@gmail.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'krishnaniti123@gmail.com';
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.user_tenant_mapping WHERE user_id = v_user_id;
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, v_target_tenant_id, 'super_admin');
        RAISE NOTICE 'Mapped krishnaniti123@gmail.com to tenant bf4c7152-6006-41b5-9c7d-84c76ea67da4 as super_admin';
    ELSE
        RAISE NOTICE 'User krishnaniti123@gmail.com not found in auth.users';
    END IF;
END $$;
