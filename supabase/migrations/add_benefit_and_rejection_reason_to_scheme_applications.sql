-- Add benefit and rejection_reason columns to scheme_applications table

ALTER TABLE public.scheme_applications 
ADD COLUMN IF NOT EXISTS benefit TEXT DEFAULT '';

ALTER TABLE public.scheme_applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
