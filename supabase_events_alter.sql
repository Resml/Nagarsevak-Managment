-- Add target_audience column to events table
alter table events 
add column if not exists target_audience text default 'All';

-- Add check constraint to ensure valid categories if needed, for now just text is fine
-- We will handle the dropdown values in the frontend: All, OPEN, OBC, SC, ST, VJNT, etc.
