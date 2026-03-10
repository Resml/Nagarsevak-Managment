-- Add area column to ward_provisions table
ALTER TABLE public.ward_provisions 
ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '';
