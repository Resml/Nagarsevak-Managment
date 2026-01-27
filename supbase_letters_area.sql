-- Add area column to letter_requests table
ALTER TABLE letter_requests ADD COLUMN IF NOT EXISTS area text;
