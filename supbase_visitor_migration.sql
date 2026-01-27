-- Add reference column to visitors table
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS reference text;
