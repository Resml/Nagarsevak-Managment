-- Add area column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS area text;
