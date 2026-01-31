-- Add 'area' column to 'events' table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS area text;

-- Optional: Add index for performance if filtering by area becomes common
CREATE INDEX IF NOT EXISTS idx_events_area ON public.events(area);
