-- Add tenant_id column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Tenant Isolation Select Staff" ON staff;
DROP POLICY IF EXISTS "Tenant Isolation Insert Staff" ON staff;
DROP POLICY IF EXISTS "Tenant Isolation Update Staff" ON staff;
DROP POLICY IF EXISTS "Tenant Isolation Delete Staff" ON staff;
DROP POLICY IF EXISTS "Public Access Staff" ON staff;
DROP POLICY IF EXISTS "Admin Manage Staff" ON staff;

-- Policies for Staff Table (Tenant Isolation)
CREATE POLICY "Tenant Isolation Select Staff" ON staff FOR SELECT USING (
  tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Insert Staff" ON staff FOR INSERT WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Update Staff" ON staff FOR UPDATE USING (
  tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Delete Staff" ON staff FOR DELETE USING (
  tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Backfill tenant_id for existing staff (default to 'default' tenant if null)
DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'default' LIMIT 1;
  IF default_tenant_id IS NOT NULL THEN
    UPDATE staff SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;
