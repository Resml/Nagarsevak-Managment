-- Add tenant_id to letter_types table for multi-tenant support

-- Step 1: Add tenant_id column
ALTER TABLE letter_types ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: Set tenant_id for existing records (assuming first tenant)
UPDATE letter_types 
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

-- Step 3: Make tenant_id required
ALTER TABLE letter_types ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE letter_types 
ADD CONSTRAINT fk_letter_types_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_letter_types_tenant_id ON letter_types(tenant_id);

-- Step 6: Enable RLS on letter_types
ALTER TABLE letter_types ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
DROP POLICY IF EXISTS "letter_types_tenant_isolation" ON letter_types;
CREATE POLICY "letter_types_tenant_isolation" ON letter_types
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Verification query
-- SELECT id, name, tenant_id FROM letter_types LIMIT 5;
