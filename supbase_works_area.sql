-- Add area column to works table
ALTER TABLE works ADD COLUMN IF NOT EXISTS area text;
