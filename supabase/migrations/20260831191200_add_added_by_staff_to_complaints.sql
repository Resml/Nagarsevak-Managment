-- Add added_by_staff_id to complaints
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS added_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
