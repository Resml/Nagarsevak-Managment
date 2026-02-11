-- Migration to add voter_id to letter_requests, area_problems, personal_requests, and complaints
-- This allows linking all user interactions to specific voter records

-- Add voter_id to letter_requests (should already exist but ensuring type/link)
ALTER TABLE letter_requests 
ADD COLUMN IF NOT EXISTS voter_id BIGINT REFERENCES voters(id) ON DELETE SET NULL;

-- Add voter_id to area_problems
ALTER TABLE area_problems 
ADD COLUMN IF NOT EXISTS voter_id BIGINT REFERENCES voters(id) ON DELETE SET NULL;

-- Add voter_id to personal_requests
ALTER TABLE personal_requests 
ADD COLUMN IF NOT EXISTS voter_id BIGINT REFERENCES voters(id) ON DELETE SET NULL;

-- Add voter_id to complaints
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS voter_id BIGINT REFERENCES voters(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_letter_requests_voter_id ON letter_requests(voter_id);
CREATE INDEX IF NOT EXISTS idx_area_problems_voter_id ON area_problems(voter_id);
CREATE INDEX IF NOT EXISTS idx_personal_requests_voter_id ON personal_requests(voter_id);
CREATE INDEX IF NOT EXISTS idx_complaints_voter_id ON complaints(voter_id);
