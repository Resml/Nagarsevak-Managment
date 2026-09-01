ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.area_problems
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.personal_requests
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
