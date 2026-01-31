-- Fix 'events' table schema by adding missing columns

-- Add 'area' column if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS area text;

-- Add 'target_audience' column if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'All';

-- Add 'event_time' column if it doesn't exist (just in case)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time text;

-- Add indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_events_area ON public.events(area);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_audience ON public.events(target_audience);
