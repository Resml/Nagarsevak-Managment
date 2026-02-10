-- Create Election Results Table
-- This table stores municipal election results by ward and booth

-- Drop table if exists (CAREFUL: This will delete existing data)
-- DROP TABLE IF EXISTS election_results CASCADE;

-- Create the table
CREATE TABLE IF NOT EXISTS election_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ward and Booth Information
    ward_name TEXT NOT NULL,
    booth_number TEXT NOT NULL,
    booth_name TEXT NOT NULL,
    
    -- Voting Statistics
    total_voters INTEGER NOT NULL DEFAULT 0,
    total_votes_casted INTEGER NOT NULL DEFAULT 0,
    
    -- Candidate Results (JSON object with candidate names as keys and vote counts as values)
    -- Example: {"Candidate A": 1500, "Candidate B": 1200, "NOTA": 50}
    candidate_votes JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Winner Information
    winner TEXT,
    margin INTEGER DEFAULT 0,
    
    -- Multi-tenancy
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_election_results_tenant_id ON election_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_election_results_ward_name ON election_results(ward_name);
CREATE INDEX IF NOT EXISTS idx_election_results_booth_number ON election_results(booth_number);

-- Enable Row Level Security (RLS)
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view election results for their tenant" ON election_results;
DROP POLICY IF EXISTS "Users can insert election results for their tenant" ON election_results;
DROP POLICY IF EXISTS "Users can update election results for their tenant" ON election_results;
DROP POLICY IF EXISTS "Users can delete election results for their tenant" ON election_results;

-- RLS Policy: Users can only view results for their tenant
CREATE POLICY "Users can view election results for their tenant"
    ON election_results
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_mapping 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert results for their tenant (admin only)
CREATE POLICY "Users can insert election results for their tenant"
    ON election_results
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_mapping 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policy: Users can update results for their tenant (admin only)
CREATE POLICY "Users can update election results for their tenant"
    ON election_results
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_mapping 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS Policy: Users can delete results for their tenant (admin only)
CREATE POLICY "Users can delete election results for their tenant"
    ON election_results
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_mapping 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_election_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_election_results_updated_at ON election_results;

CREATE TRIGGER trigger_update_election_results_updated_at
    BEFORE UPDATE ON election_results
    FOR EACH ROW
    EXECUTE FUNCTION update_election_results_updated_at();

-- Grant necessary permissions
GRANT SELECT ON election_results TO authenticated;
GRANT INSERT, UPDATE, DELETE ON election_results TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Election results table created successfully with RLS policies!';
END $$;
