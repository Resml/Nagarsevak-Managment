-- Secure improvements RLS
ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if any existing
DROP POLICY IF EXISTS "Allow authenticated insert improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow authenticated update improvements" ON public.improvements;
DROP POLICY IF EXISTS "Allow authenticated select improvements" ON public.improvements;

-- Ensure standard tenant isolation policies exist
-- Drop them first to be sure
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.improvements;

-- Re-create tenant isolation policies
-- Select: user can only see rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Select" ON public.improvements FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Insert: user can only insert rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Insert" ON public.improvements FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Update: user can only update rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Update" ON public.improvements FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Delete: user can only delete rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Delete" ON public.improvements FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);
