-- Add tenant_id column to ward_provisions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ward_provisions' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.ward_provisions ADD COLUMN tenant_id UUID;
        
        -- Add foreign key constraint if tenants table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
             ALTER TABLE public.ward_provisions ADD CONSTRAINT fk_ward_provisions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
        END IF;
    END IF;
END $$;

-- Backfill existing provisions with default tenant if tenant_id is NULL
DO $$
DECLARE
    target_tenant_id UUID;
BEGIN
    -- Get the ID of the first tenant
    SELECT id INTO target_tenant_id FROM public.tenants LIMIT 1;

    IF target_tenant_id IS NOT NULL THEN
        UPDATE public.ward_provisions
        SET tenant_id = target_tenant_id
        WHERE tenant_id IS NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.ward_provisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.ward_provisions;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.ward_provisions;

-- Create Tenant Isolation Policies
-- Select: user can only see rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Select" ON public.ward_provisions FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Insert: user can only insert rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Insert" ON public.ward_provisions FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Update: user can only update rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Update" ON public.ward_provisions FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Delete: user can only delete rows where tenant_id matches their mapping
CREATE POLICY "Tenant Isolation Delete" ON public.ward_provisions FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS ward_provisions_tenant_id_idx ON public.ward_provisions(tenant_id);
