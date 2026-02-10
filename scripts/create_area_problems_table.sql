-- Create area_problems table for reporting area-wide issues

CREATE TABLE IF NOT EXISTS area_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL, -- WhatsApp number without @s.whatsapp.net
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    category VARCHAR(100), -- e.g., 'Roads', 'Water Supply', 'Electricity', etc.
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Resolved
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_area_problems_tenant_id ON area_problems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_area_problems_status ON area_problems(status);
CREATE INDEX IF NOT EXISTS idx_area_problems_created_at ON area_problems(created_at DESC);

-- Enable RLS
ALTER TABLE area_problems ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "area_problems_tenant_isolation" ON area_problems;
CREATE POLICY "area_problems_tenant_isolation" ON area_problems
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Verification query
-- SELECT id, title, status, user_id FROM area_problems WHERE tenant_id = 'your-tenant-id' LIMIT 5;
