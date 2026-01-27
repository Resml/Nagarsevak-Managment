-- Add area column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS area text;
