-- Add metadata column to visitors table for flexible field storage
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN visitors.metadata IS 'Stores dynamic fields based on visit purpose (e.g., event_date, event_time for Greetings)';
