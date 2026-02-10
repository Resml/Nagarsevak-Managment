-- Add reporter information columns to area_problems table
ALTER TABLE area_problems 
ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS reporter_mobile VARCHAR(20);

-- Update RLS if necessary (it should be fine since it's tenant-based)
-- But let's ensure the index exists for performance if we filter by mobile
CREATE INDEX IF NOT EXISTS idx_area_problems_reporter_mobile ON area_problems(reporter_mobile);
