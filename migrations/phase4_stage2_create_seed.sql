BEGIN;

-- 1. Create Entitlement Schema
CREATE TABLE IF NOT EXISTS public.features (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_key text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    module text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_key text UNIQUE NOT NULL, -- 'basic', 'pro', 'advance', 'custom'
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
    plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT true,
    PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_feature_overrides (
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE,
    is_enabled boolean NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (tenant_id, feature_id)
);

-- 2. Seed Plans
INSERT INTO public.plans (plan_key, name) VALUES 
('basic', 'Basic Plan'),
('pro', 'Pro Plan'),
('advance', 'Advance Plan'),
('custom', 'Custom Plan')
ON CONFLICT (plan_key) DO NOTHING;

-- 3. Seed Features
-- Basic features
INSERT INTO public.features (feature_key, name) VALUES
('tasks', 'Daily Work Management'), ('letters', 'Letter Management'),
('visitors', 'Visitor Management'), ('complaints', 'Complaint Tracking'),
('ward_problems', 'Ward Issues Management - Problems'), ('ward_info', 'Ward Issues Management - Map'),
('work_history', 'Completed Works Tracking - History'), ('social', 'Social Media Management'),
('voters', 'Voter Search'), ('housing_societies', 'Society Chairman Directory'),
('staff', 'My Team Management'), ('sms', 'SMS'), ('whatsapp', 'WhatsApp'),
('whatsapp_call', 'WhatsApp Calling'), ('public_comm', 'Group permission'),
('profile_settings', 'Profile Settings'), ('bot', 'Bot Dashboard')
ON CONFLICT (feature_key) DO NOTHING;

-- Pro features
INSERT INTO public.features (feature_key, name) VALUES
('karyakarta_work', 'Karyakarta Work Management'), ('schemes', 'Government Schemes'),
('provision', 'Budget Provisions / Fund Allocation'), ('ai_content', 'AI Content Studio'),
('gallery', 'Photo Gallery'), ('results', 'Election Results'),
('sadasya', 'Member Registration')
ON CONFLICT (feature_key) DO NOTHING;

-- Advance features
INSERT INTO public.features (feature_key, name) VALUES
('improvements', 'Completed Works Tracking - Improvements'), ('gb_register', 'Daily Diary'),
('opposition', 'Opposition Info'), ('social_organizations', 'NGO & Mandals Info'),
('voter_forms', 'Voter Forms'), ('budget', 'Budget Provisions'),
('newspaper', 'Newspaper coverage'), ('media_tracking', 'Media Tracking'),
('ai_voice_call', 'AI Voice Call'), ('conference_room', 'Conference Room'),
('voice_call', 'Voice Call'), ('analysis', 'Advanced Analytics'),
('surveys', 'Survey & Feedback System'), ('events', 'Event Management'),
('gov_office', 'Government Office')
ON CONFLICT (feature_key) DO NOTHING;

-- 4. Seed Plan-to-Feature Mappings
DO $$
DECLARE
    v_basic uuid; v_pro uuid; v_adv uuid;
BEGIN
    SELECT id INTO v_basic FROM public.plans WHERE plan_key = 'basic';
    SELECT id INTO v_pro FROM public.plans WHERE plan_key = 'pro';
    SELECT id INTO v_adv FROM public.plans WHERE plan_key = 'advance';

    -- Basic features assigned to ALL 3 plans
    INSERT INTO public.plan_features (plan_id, feature_id)
    SELECT p.id, f.id FROM public.features f
    CROSS JOIN (VALUES (v_basic), (v_pro), (v_adv)) AS p(id)
    WHERE f.feature_key IN ('tasks', 'letters', 'visitors', 'complaints', 'ward_problems', 'ward_info', 'work_history', 'social', 'voters', 'housing_societies', 'staff', 'sms', 'whatsapp', 'whatsapp_call', 'public_comm', 'profile_settings', 'bot')
    ON CONFLICT (plan_id, feature_id) DO NOTHING;

    -- Pro features assigned to Pro and Advance
    INSERT INTO public.plan_features (plan_id, feature_id)
    SELECT p.id, f.id FROM public.features f
    CROSS JOIN (VALUES (v_pro), (v_adv)) AS p(id)
    WHERE f.feature_key IN ('karyakarta_work', 'schemes', 'provision', 'ai_content', 'gallery', 'results', 'sadasya')
    ON CONFLICT (plan_id, feature_id) DO NOTHING;

    -- Advance features assigned to Advance only
    INSERT INTO public.plan_features (plan_id, feature_id)
    SELECT p.id, f.id FROM public.features f
    CROSS JOIN (VALUES (v_adv)) AS p(id)
    WHERE f.feature_key IN ('improvements', 'gb_register', 'opposition', 'social_organizations', 'voter_forms', 'budget', 'newspaper', 'media_tracking', 'ai_voice_call', 'conference_room', 'voice_call', 'analysis', 'surveys', 'events', 'gov_office')
    ON CONFLICT (plan_id, feature_id) DO NOTHING;
END $$;

-- 5. Migrate Existing Config Overrides (Enabled)
INSERT INTO public.tenant_feature_overrides (tenant_id, feature_id, is_enabled)
SELECT 
    t.id AS tenant_id,
    f.id AS feature_id,
    true AS is_enabled
FROM public.tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE 
        WHEN jsonb_typeof(t.config->'enabled_features') = 'array' THEN t.config->'enabled_features'
        ELSE '[]'::jsonb
    END
) AS feat_key
JOIN public.features f ON f.feature_key = feat_key
ON CONFLICT (tenant_id, feature_id) DO UPDATE SET is_enabled = true;

-- 6. Migrate Existing Config Overrides (Disabled)
INSERT INTO public.tenant_feature_overrides (tenant_id, feature_id, is_enabled)
SELECT 
    t.id AS tenant_id,
    f.id AS feature_id,
    false AS is_enabled
FROM public.tenants t
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE 
        WHEN jsonb_typeof(t.config->'disabled_features') = 'array' THEN t.config->'disabled_features'
        ELSE '[]'::jsonb
    END
) AS feat_key
JOIN public.features f ON f.feature_key = feat_key
ON CONFLICT (tenant_id, feature_id) DO UPDATE SET is_enabled = false;

-- 7. Add Required Indexes
CREATE INDEX IF NOT EXISTS idx_tfo_tenant_feature ON public.tenant_feature_overrides(tenant_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_pf_plan_feature ON public.plan_features(plan_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_features_key ON public.features(feature_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_key ON public.plans(plan_key);

-- 8. Create Server-Authoritative Function (DO NOT apply to RLS yet)
CREATE OR REPLACE FUNCTION public.has_feature_access(
    p_tenant_id uuid,
    p_feature_key text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_plan_key text;
    v_feature_id uuid;
    v_override_enabled boolean;
    v_base_enabled boolean;
BEGIN
    -- 1. Security constraint: Verify the executing user has authorization for the tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.user_tenant_mapping 
        WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.user_tenant_mapping 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RETURN false;
    END IF;

    -- 2. Resolve feature
    SELECT id INTO v_feature_id FROM public.features WHERE feature_key = p_feature_key AND is_active = true;
    IF v_feature_id IS NULL THEN RETURN false; END IF;

    -- 3. Check for specific tenant override (highest priority)
    SELECT is_enabled INTO v_override_enabled 
    FROM public.tenant_feature_overrides 
    WHERE tenant_id = p_tenant_id AND feature_id = v_feature_id;
    
    IF FOUND THEN RETURN v_override_enabled; END IF;

    -- 4. Check base plan entitlement
    SELECT plan INTO v_plan_key FROM public.tenants WHERE id = p_tenant_id;
    IF v_plan_key IS NULL THEN RETURN false; END IF;

    SELECT pf.is_enabled INTO v_base_enabled
    FROM public.plan_features pf
    JOIN public.plans p ON p.id = pf.plan_id
    WHERE LOWER(p.plan_key) = LOWER(v_plan_key) AND pf.feature_id = v_feature_id;

    RETURN COALESCE(v_base_enabled, false);
END;
$function$;

COMMIT;
