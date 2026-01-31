-- Add area column to gb_diary table
ALTER TABLE gb_diary 
ADD COLUMN IF NOT EXISTS area text;

-- Add index for area column
CREATE INDEX IF NOT EXISTS idx_gb_diary_area ON gb_diary(area);
