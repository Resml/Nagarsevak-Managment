-- Create Work Trackers table
CREATE TABLE IF NOT EXISTS work_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT,
    department TEXT,
    inward_number TEXT,
    outward_number TEXT,
    current_status TEXT NOT NULL DEFAULT 'Pending',
    description TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Work Tracker History table (for tracking movement history)
CREATE TABLE IF NOT EXISTS work_tracker_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_tracker_id UUID REFERENCES work_trackers(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL, -- e.g. "Department Desk", "Commissioner Desk"
    location TEXT, -- e.g. "Municipal Office, Room 402"
    status_description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE work_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tracker_history ENABLE ROW LEVEL SECURITY;

-- Policies for work_trackers
CREATE POLICY "Users can see their tenant's work trackers"
ON work_trackers FOR SELECT
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert work trackers for their tenant"
ON work_trackers FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update work trackers for their tenant"
ON work_trackers FOR UPDATE
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete work trackers for their tenant"
ON work_trackers FOR DELETE
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Policies for work_tracker_history
CREATE POLICY "Users can see their tenant's work tracker history"
ON work_tracker_history FOR SELECT
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert work tracker history for their tenant"
ON work_tracker_history FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_work_trackers_tenant_id ON work_trackers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_tracker_history_tracker_id ON work_tracker_history(work_tracker_id);
