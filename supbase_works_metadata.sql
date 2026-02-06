-- Add metadata column to works table
ALTER TABLE works ADD COLUMN IF NOT EXISTS metadata jsonb;
