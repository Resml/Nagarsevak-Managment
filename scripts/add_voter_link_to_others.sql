-- Migration to add voter_id to letter_requests and area_problems
-- This allows linking letters and ward problems to specific voter records

-- Add voter_id to letter_requests
ALTER TABLE letter_requests 
ADD COLUMN IF NOT EXISTS voter_id UUID REFERENCES voters(id) ON DELETE SET NULL;

-- Add voter_id to area_problems
ALTER TABLE area_problems 
ADD COLUMN IF NOT EXISTS voter_id UUID REFERENCES voters(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_letter_requests_voter_id ON letter_requests(voter_id);
CREATE INDEX IF NOT EXISTS idx_area_problems_voter_id ON area_problems(voter_id);
