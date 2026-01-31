-- Add area column to visitors table
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS area text;

-- Add index for area column
CREATE INDEX IF NOT EXISTS idx_visitors_area ON visitors(area);
