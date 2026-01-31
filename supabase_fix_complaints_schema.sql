-- Add missing columns to complaints table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
