-- Phase 2 - 006 - Enforce NOT NULL
-- Enforces NOT NULL constraints safely on the explicitly audited tables.

ALTER TABLE public.area_problems ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.event_rsvps ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.letter_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.personal_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.scheme_applications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.survey_responses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.sadasya ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.voter_applications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.work_tracker_history ALTER COLUMN tenant_id SET NOT NULL;
