-- MULTI-TENANT ENTERPRISE SECURITY ARCHITECTURE MIGRATION SCRIPT
-- Execute this script in the Supabase SQL Editor to enforce Zero-Trust isolation.

-- 1. Create Security Audit Logs Table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    event_type TEXT NOT NULL, -- e.g., 'unauthorized_route_access', 'tenant_mismatch', 'suspicious_request'
    details JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to insert security logs (public / authenticated)
DROP POLICY IF EXISTS "Users can insert security audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can insert security audit logs" ON public.security_audit_logs FOR INSERT WITH CHECK (true);

-- Allow admins / nagarsevaks to view their tenant's audit logs, and super admins to view all
DROP POLICY IF EXISTS "Admins can view tenant audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view tenant audit logs" ON public.security_audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_tenant_mapping
        WHERE user_id = auth.uid()
        AND tenant_id = security_audit_logs.tenant_id
        AND role IN ('nagarsevak', 'admin', 'amdar', 'khasdar', 'minister')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_tenant_mapping
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
);

-- 2. Trigger Function to Populate Record Tenant Details
CREATE OR REPLACE FUNCTION populate_record_tenant_details()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    SELECT UPPER(tier), UPPER(plan) INTO NEW.category, NEW.plan
    FROM public.tenants
    WHERE id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Dynamic Function to Migrate Tables
CREATE OR REPLACE FUNCTION secure_table_for_multitenancy(t_name text)
RETURNS void as $$
BEGIN
  -- Check if table exists
  IF to_regclass(t_name) IS NULL THEN
    RAISE NOTICE 'Table % does not exist, skipping.', t_name;
    RETURN;
  END IF;

  -- Add columns
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;', t_name);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS category text;', t_name);
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS plan text;', t_name);

  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t_name);

  -- Create trigger to populate details on Insert/Update
  EXECUTE format('DROP TRIGGER IF EXISTS trg_populate_details_%I ON %I;', t_name, t_name);
  EXECUTE format('CREATE TRIGGER trg_populate_details_%I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION populate_record_tenant_details();', t_name, t_name);

  -- Drop existing tenant policies
  EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Select" ON %I;', t_name);
  EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Insert" ON %I;', t_name);
  EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Update" ON %I;', t_name);
  EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation Delete" ON %I;', t_name);

  -- Policy: SELECT (Read) - Restricted strictly to mapped tenant/category/plan, or Super Admin
  EXECUTE format('CREATE POLICY "Tenant Isolation Select" ON %I FOR SELECT USING (
    (tenant_id = (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
     AND category = (SELECT UPPER(tier) FROM public.tenants WHERE id = tenant_id)
     AND plan = (SELECT UPPER(plan) FROM public.tenants WHERE id = tenant_id))
    OR
    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = ''super_admin'')
  );', t_name);

  -- Policy: INSERT (Create) - Restricted strictly to mapped tenant, or Super Admin
  EXECUTE format('CREATE POLICY "Tenant Isolation Insert" ON %I FOR INSERT WITH CHECK (
    (tenant_id = (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid()))
    OR
    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = ''super_admin'')
  );', t_name);

  -- Policy: UPDATE (Modify) - Restricted strictly to mapped tenant/category/plan, or Super Admin
  EXECUTE format('CREATE POLICY "Tenant Isolation Update" ON %I FOR UPDATE USING (
    (tenant_id = (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
     AND category = (SELECT UPPER(tier) FROM public.tenants WHERE id = tenant_id)
     AND plan = (SELECT UPPER(plan) FROM public.tenants WHERE id = tenant_id))
    OR
    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = ''super_admin'')
  );', t_name);

  -- Policy: DELETE (Remove) - Restricted strictly to mapped tenant/category/plan, or Super Admin
  EXECUTE format('CREATE POLICY "Tenant Isolation Delete" ON %I FOR DELETE USING (
    (tenant_id = (SELECT tenant_id FROM public.user_tenant_mapping WHERE user_id = auth.uid())
     AND category = (SELECT UPPER(tier) FROM public.tenants WHERE id = tenant_id)
     AND plan = (SELECT UPPER(plan) FROM public.tenants WHERE id = tenant_id))
    OR
    EXISTS (SELECT 1 FROM public.user_tenant_mapping WHERE user_id = auth.uid() AND role = ''super_admin'')
  );', t_name);
END;
$$ language plpgsql;

-- Apply security to all transactional tables
SELECT secure_table_for_multitenancy('voters');
SELECT secure_table_for_multitenancy('complaints');
SELECT secure_table_for_multitenancy('letter_requests');
SELECT secure_table_for_multitenancy('gb_diary');
SELECT secure_table_for_multitenancy('gallery');
SELECT secure_table_for_multitenancy('works');
SELECT secure_table_for_multitenancy('events');
SELECT secure_table_for_multitenancy('schemes');
SELECT secure_table_for_multitenancy('visitors');
SELECT secure_table_for_multitenancy('staff');
SELECT secure_table_for_multitenancy('sadasya');
SELECT secure_table_for_multitenancy('surveys');
SELECT secure_table_for_multitenancy('survey_responses');
SELECT secure_table_for_multitenancy('housing_societies');
SELECT secure_table_for_multitenancy('social_organizations');
SELECT secure_table_for_multitenancy('non_voters');
SELECT secure_table_for_multitenancy('improvements');
SELECT secure_table_for_multitenancy('ward_problems');
SELECT secure_table_for_multitenancy('event_rsvps');
SELECT secure_table_for_multitenancy('scheme_beneficiaries');
SELECT secure_table_for_multitenancy('personal_requests');
SELECT secure_table_for_multitenancy('ward_provisions');
SELECT secure_table_for_multitenancy('ward_budget');
SELECT secure_table_for_multitenancy('message_logs');
SELECT secure_table_for_multitenancy('letter_types');
SELECT secure_table_for_multitenancy('ai_history');
SELECT secure_table_for_multitenancy('incoming_letters');
SELECT secure_table_for_multitenancy('work_trackers');
SELECT secure_table_for_multitenancy('work_feedback');

-- Clean up helper function
DROP FUNCTION secure_table_for_multitenancy(text);

-- 4. Add trigger function to tenants to cascade updates to all tables if tier/plan changes
CREATE OR REPLACE FUNCTION cascade_tenant_details_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.tier IS DISTINCT FROM NEW.tier) OR (OLD.plan IS DISTINCT FROM NEW.plan) THEN
    UPDATE public.voters SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.complaints SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.letter_requests SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.gb_diary SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.gallery SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.works SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.events SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.schemes SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.visitors SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.staff SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.sadasya SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.surveys SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.survey_responses SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.housing_societies SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.social_organizations SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.non_voters SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.improvements SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.ward_problems SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.event_rsvps SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.scheme_beneficiaries SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.personal_requests SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.ward_provisions SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.ward_budget SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.message_logs SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.letter_types SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.ai_history SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.incoming_letters SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.work_trackers SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
    UPDATE public.work_feedback SET category = UPPER(NEW.tier), plan = UPPER(NEW.plan) WHERE tenant_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_tenant_details ON public.tenants;
CREATE TRIGGER trg_cascade_tenant_details
AFTER UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION cascade_tenant_details_update();
