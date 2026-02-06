-- Add missing columns for Complaint Form Enhancements
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS description_meta jsonb,
ADD COLUMN IF NOT EXISTS area text,
ADD COLUMN IF NOT EXISTS voter_id bigint REFERENCES voters(id);

-- Add index for area to speed up searches
CREATE INDEX IF NOT EXISTS idx_complaints_area ON complaints(area);
