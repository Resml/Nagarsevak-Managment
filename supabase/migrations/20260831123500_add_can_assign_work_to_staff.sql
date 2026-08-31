-- Add can_assign_work boolean flag to staff table
-- This allows specific staff members to assign tasks and complaints to other staff

ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS can_assign_work BOOLEAN DEFAULT false;
