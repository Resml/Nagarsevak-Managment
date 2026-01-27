-- Add area column to ward_budget table
ALTER TABLE ward_budget ADD COLUMN IF NOT EXISTS area text;
