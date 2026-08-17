-- FIX MAMIT TENANT, USER MAPPING, AND SUPABASE RLS POLICIES
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. Ensure Tenants table has public read access so that subdomain lookups & branding work for everyone
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can read own tenant" ON public.tenants;
CREATE POLICY "Allow public read of tenants" ON public.tenants 
    FOR SELECT 
    USING (true);

-- 2. Ensure User Tenant Mapping table allows users to read their own mapping
ALTER TABLE public.user_tenant_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tenant mapping" ON public.user_tenant_mapping;
CREATE POLICY "Users can read own tenant mapping" ON public.user_tenant_mapping 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 3. Update the tenant with Mamit Chougale data to have subdomain 'mamit' and tier 'nagarsevak' / plan 'advance'
UPDATE public.tenants
SET 
    subdomain = 'mamit',
    name = 'Mamit Chougale',
    tier = 'nagarsevak',
    plan = 'advance',
    config = COALESCE(config, '{}'::jsonb) || '{
        "nagarsevak_name_english": "Mamit Chougale",
        "nagarsevak_name_marathi": "मामित चौगुले",
        "email_address": "mamit@gmail.com"
    }'::jsonb
WHERE id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';

-- If the tenant doesn't exist for any reason, create it:
INSERT INTO public.tenants (id, name, subdomain, tier, plan, config)
VALUES (
    'bf4c7152-6006-41b5-9c7d-84c76ea67da4',
    'Mamit Chougale',
    'mamit',
    'nagarsevak',
    'advance',
    '{
        "nagarsevak_name_english": "Mamit Chougale",
        "nagarsevak_name_marathi": "मामित चौगुले",
        "email_address": "mamit@gmail.com"
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    subdomain = 'mamit',
    name = 'Mamit Chougale',
    tier = 'nagarsevak',
    plan = 'advance';

-- 4. Map user 'mamit@gmail.com' and other admin users to this tenant
DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID := 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
BEGIN
    -- Link by explicit User ID if found
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '9f636791-705c-4437-8e66-c152bbabcb77') THEN
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES ('9f636791-705c-4437-8e66-c152bbabcb77', v_tenant_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET tenant_id = v_tenant_id, role = 'admin';
        RAISE NOTICE 'Linked user 9f636791-705c-4437-8e66-c152bbabcb77 to tenant %', v_tenant_id;
    END IF;

    -- Link all matching emails
    FOR v_user_id IN 
        SELECT id FROM auth.users 
        WHERE email IN ('mamit@gmail.com', 'krishnaniti@gmail.com', 'krishnaniti123@gmail.com')
    LOOP
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_user_id, v_tenant_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET tenant_id = v_tenant_id, role = 'admin';
        RAISE NOTICE 'Linked email user % to tenant %', v_user_id, v_tenant_id;
    END LOOP;
END $$;

-- 5. Verification query
SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.subdomain,
    t.tier,
    t.plan,
    utm.user_id,
    utm.role,
    au.email
FROM public.tenants t
LEFT JOIN public.user_tenant_mapping utm ON utm.tenant_id = t.id
LEFT JOIN auth.users au ON au.id = utm.user_id;
