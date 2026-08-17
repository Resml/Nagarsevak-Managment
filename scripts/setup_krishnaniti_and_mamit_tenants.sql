-- ==============================================================================
-- STRICT MULTI-TENANT ISOLATION: KRISHNANITI & MAMIT
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Enable RLS and setup policies on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can read own tenant" ON public.tenants;
CREATE POLICY "Allow public read of tenants" ON public.tenants 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;
CREATE POLICY "Users can update own tenant" ON public.tenants
    FOR UPDATE
    USING (
        id IN (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
    WITH CHECK (
        id IN (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- 2. Enable RLS on user_tenant_mapping
ALTER TABLE public.user_tenant_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tenant mapping" ON public.user_tenant_mapping;
CREATE POLICY "Users can read own tenant mapping" ON public.user_tenant_mapping 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 3. Ensure Storage Bucket Policies allow viewing and uploading app assets
DROP POLICY IF EXISTS "Public can view app-assets" ON storage.objects;
CREATE POLICY "Public can view app-assets" ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "Authenticated users can upload to app-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload to app-assets" ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "Authenticated users can update app-assets" ON storage.objects;
CREATE POLICY "Authenticated users can update app-assets" ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'app-assets');

-- 4. Enable RLS on complaints table to enforce tenant isolation
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.complaints;
DROP POLICY IF EXISTS "Allow public read" ON public.complaints;
CREATE POLICY "Tenant Isolation Select" ON public.complaints 
    FOR SELECT 
    USING (
        tenant_id IN (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.complaints;
DROP POLICY IF EXISTS "Allow public insert" ON public.complaints;
CREATE POLICY "Tenant Isolation Insert" ON public.complaints 
    FOR INSERT 
    WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.complaints;
CREATE POLICY "Tenant Isolation Update" ON public.complaints 
    FOR UPDATE 
    USING (
        tenant_id IN (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
    );

-- ==============================================================================
-- 5. SETUP TENANT 1: KRISHNANITI (DEMO TENANT WITH ALL EXISTING DATA)
-- ==============================================================================
UPDATE public.tenants
SET 
    subdomain = 'krishnaniti',
    name = 'Krishnaniti',
    tier = 'nagarsevak',
    plan = 'advance'
WHERE id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';

-- Map Krishnaniti users strictly to Krishnaniti demo tenant
DO $$
DECLARE
    v_demo_user_id UUID;
    v_demo_tenant_id UUID := 'bf4c7152-6006-41b5-9c7d-84c76ea67da4';
BEGIN
    FOR v_demo_user_id IN 
        SELECT id FROM auth.users 
        WHERE email IN ('krishnaniti@gmail.com', 'krishnaniti123@gmail.com')
    LOOP
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_demo_user_id, v_demo_tenant_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET tenant_id = v_demo_tenant_id, role = 'admin';
        RAISE NOTICE 'Mapped demo user % to Krishnaniti demo tenant %', v_demo_user_id, v_demo_tenant_id;
    END LOOP;
END $$;

-- Link existing unassigned complaints and records strictly to Krishnaniti Demo Tenant
UPDATE public.complaints 
SET tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4' 
WHERE tenant_id IS NULL;

UPDATE public.gallery 
SET tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4' 
WHERE tenant_id IS NULL;

UPDATE public.visitors 
SET tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4' 
WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';

UPDATE public.improvements 
SET tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4' 
WHERE tenant_id IS NULL OR tenant_id = '05482ac2-e3ea-4e41-84cc-76be80fe0341';

-- ==============================================================================
-- 6. SETUP TENANT 2: MAMIT CHOUGALE (FRESH ISOLATED TENANT - ZERO DEMO DATA)
-- ==============================================================================
DO $$
DECLARE
    v_mamit_tenant_id UUID := 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';
    v_mamit_user_id UUID;
BEGIN
    -- Check if tenant with subdomain 'mamit' already exists
    SELECT id INTO v_mamit_tenant_id FROM public.tenants WHERE subdomain = 'mamit' LIMIT 1;
    
    IF v_mamit_tenant_id IS NULL THEN
        v_mamit_tenant_id := 'e5a973bb-54de-4a92-bd17-91a97d7fefc3';
        INSERT INTO public.tenants (id, name, subdomain, tier, plan, config)
        VALUES (
            v_mamit_tenant_id,
            'Mamit Chougale',
            'mamit',
            'nagarsevak',
            'advance',
            '{
                "nagarsevak_name_english": "Mamit Chougale",
                "nagarsevak_name_marathi": "मामित चौगुले",
                "email_address": "mamit@gmail.com",
                "profile_image_url": "https://qdvciisgxvupvrjygedr.supabase.co/storage/v1/object/public/app-assets/bf4c7152-6006-41b5-9c7d-84c76ea67da4_profile_1778757111210.jpg?t=1778757111849",
                "party_logo_url": "https://qdvciisgxvupvrjygedr.supabase.co/storage/v1/object/public/app-assets/bf4c7152-6006-41b5-9c7d-84c76ea67da4_party_1778758534146.jpg?t=1778758534544",
                "disabled_features": ["voice_call", "ai_voice_call", "whatsapp_call", "media_tracking"]
            }'::jsonb
        );
        RAISE NOTICE 'Created new fresh Mamit tenant with ID %', v_mamit_tenant_id;
    ELSE
        UPDATE public.tenants
        SET 
            name = 'Mamit Chougale',
            tier = 'nagarsevak',
            plan = 'advance',
            config = COALESCE(config, '{}'::jsonb) || '{
                "nagarsevak_name_english": "Mamit Chougale",
                "nagarsevak_name_marathi": "मामित चौगुले",
                "email_address": "mamit@gmail.com",
                "profile_image_url": "https://qdvciisgxvupvrjygedr.supabase.co/storage/v1/object/public/app-assets/bf4c7152-6006-41b5-9c7d-84c76ea67da4_profile_1778757111210.jpg?t=1778757111849",
                "party_logo_url": "https://qdvciisgxvupvrjygedr.supabase.co/storage/v1/object/public/app-assets/bf4c7152-6006-41b5-9c7d-84c76ea67da4_party_1778758534146.jpg?t=1778758534544",
                "disabled_features": ["voice_call", "ai_voice_call", "whatsapp_call", "media_tracking"]
            }'::jsonb
        WHERE id = v_mamit_tenant_id;
        RAISE NOTICE 'Updated existing Mamit tenant with ID %', v_mamit_tenant_id;
    END IF;

    -- Map user mamit@gmail.com strictly to the Mamit tenant
    SELECT id INTO v_mamit_user_id FROM auth.users WHERE email = 'mamit@gmail.com' LIMIT 1;
    IF v_mamit_user_id IS NULL THEN
        v_mamit_user_id := '9f636791-705c-4437-8e66-c152bbabcb77';
    END IF;

    IF v_mamit_user_id IS NOT NULL THEN
        INSERT INTO public.user_tenant_mapping (user_id, tenant_id, role)
        VALUES (v_mamit_user_id, v_mamit_tenant_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET tenant_id = v_mamit_tenant_id, role = 'admin';
        RAISE NOTICE 'Mapped user % to Mamit tenant %', v_mamit_user_id, v_mamit_tenant_id;
    END IF;
END $$;

-- ==============================================================================
-- 7. VERIFICATION: SHOW TENANTS, COUNTS & MAPPINGS
-- ==============================================================================
SELECT 
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.subdomain,
    (SELECT count(*) FROM public.voters WHERE tenant_id = t.id) AS voters_count,
    (SELECT count(*) FROM public.complaints WHERE tenant_id = t.id) AS complaints_count,
    (SELECT count(*) FROM public.schemes WHERE tenant_id = t.id) AS schemes_count,
    (SELECT count(*) FROM public.visitors WHERE tenant_id = t.id) AS visitors_count
FROM public.tenants t;
