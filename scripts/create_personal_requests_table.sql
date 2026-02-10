-- Create personal_requests table for tracking help requests (Admission, Help, etc.)

CREATE TABLE IF NOT EXISTS personal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- WhatsApp full ID
    reporter_name TEXT NOT NULL,
    reporter_mobile TEXT NOT NULL,
    request_type TEXT NOT NULL, -- Education Admission, Financial Help, Hospital, etc.
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, In Progress, Fulfilled, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal_requests ENABLE ROW LEVEL SECURITY;

-- Simple permissive policy for now (matching area_problems fix)
CREATE POLICY "personal_requests_tenant_isolation" ON personal_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);
