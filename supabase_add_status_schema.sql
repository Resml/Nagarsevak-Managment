-- Add 'status' column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'Planned';

-- Ensure 'event_date' and 'event_time' exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time text;

-- Add 'type' and 'location' just to be safe, though likely present
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type text DEFAULT 'Public Meeting';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location text;

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Force schema cache reload (Supabase specific, normally happens automatically on DDL)
NOTIFY pgrst, 'reload config';
