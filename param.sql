-- Add estimated_completion_date to complaints table
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS estimated_completion_date text;

-- Add index for performance (optional but good practice)
-- CREATE INDEX IF NOT EXISTS idx_complaints_estimated_date ON complaints(estimated_completion_date);
