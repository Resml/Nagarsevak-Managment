-- Add tenant_id column to improvements table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'improvements' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.improvements ADD COLUMN tenant_id UUID;
        
        -- Optionally set a default tenant for existing rows if needed (e.g., the first tenant found)
        -- UPDATE public.improvements SET tenant_id = (SELECT id FROM public.tenants LIMIT 1) WHERE tenant_id IS NULL;
        
        -- Add foreign key constraint if tenants table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
             ALTER TABLE public.improvements ADD CONSTRAINT fk_improvements_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.improvements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts/errors
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.improvements;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.improvements;

-- Create correct policies based on user_tenant_mapping or tenant_id check
-- Assuming standard pattern: check if user is mapped to the tenant
CREATE POLICY "Tenant Isolation Select" ON public.improvements FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Insert" ON public.improvements FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Update" ON public.improvements FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Delete" ON public.improvements FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS improvements_tenant_id_idx ON public.improvements(tenant_id);
