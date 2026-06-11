-- Add paksh, pad, and society_name columns to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS paksh TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS pad TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS society_name TEXT;
