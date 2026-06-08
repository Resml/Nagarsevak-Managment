-- Add party_wing column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS party_wing TEXT;
