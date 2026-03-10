-- Add tenant_id column to visitors table for multi-tenancy support
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_visitors_tenant_id ON visitors(tenant_id);
