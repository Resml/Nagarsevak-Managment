-- Phase 2 - 005 - Public Intake & Mixed FK Integrity
-- Secures relationships that span across tables and implements strict public intake boundaries.

-- --------------------------------------------------------
-- Helper Functions for Public Intake Lookups
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_survey_tenant(p_survey_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Only return the tenant_id if the survey is explicitly Active
  SELECT tenant_id FROM public.surveys WHERE id = p_survey_id AND status = 'Active';
$$;
ALTER FUNCTION public.get_survey_tenant(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_survey_tenant(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_survey_tenant(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_event_tenant(p_event_id bigint)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Only return the tenant_id if the event is explicitly Planned
  SELECT tenant_id FROM public.events WHERE id = p_event_id AND status = 'Planned';
$$;
ALTER FUNCTION public.get_event_tenant(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_event_tenant(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_tenant(bigint) TO anon, authenticated;


-- --------------------------------------------------------
-- 1. survey_responses
-- --------------------------------------------------------
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable insert for public" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.survey_responses;
DROP POLICY IF EXISTS "Enable select for public" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.survey_responses;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.survey_responses;

-- Public Anon Insert (Strict parent matching via SECURITY DEFINER to verified active survey)
CREATE POLICY "Anon Survey Insert" ON public.survey_responses
FOR INSERT TO anon
WITH CHECK (
  tenant_id = public.get_survey_tenant(survey_id)
);

-- Authenticated CRUD
CREATE POLICY "Auth Survey Select" ON public.survey_responses FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Survey Delete" ON public.survey_responses FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Survey Insert" ON public.survey_responses FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.surveys WHERE id = survey_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Survey Update" ON public.survey_responses FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.surveys WHERE id = survey_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 2. event_rsvps
-- --------------------------------------------------------
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.event_rsvps;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.event_rsvps;

-- Public Anon Insert (Strict parent matching to verified Planned event)
CREATE POLICY "Anon Event RSVP" ON public.event_rsvps
FOR INSERT TO anon
WITH CHECK (
  tenant_id = public.get_event_tenant(event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);

-- Authenticated CRUD
CREATE POLICY "Auth RSVP Select" ON public.event_rsvps FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth RSVP Delete" ON public.event_rsvps FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth RSVP Insert" ON public.event_rsvps FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.events WHERE id = event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth RSVP Update" ON public.event_rsvps FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.events WHERE id = event_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);

-- --------------------------------------------------------
-- 3. complaints (Removed Anon Access)
-- --------------------------------------------------------
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.complaints;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.complaints;

-- NOTE: Anon insert access removed. The application lacks a secure
-- tenant resolution mechanism (e.g., token, subdomain) for public complaints.

CREATE POLICY "Auth Complaint Select" ON public.complaints FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Complaint Delete" ON public.complaints FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Complaint Insert" ON public.complaints FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Complaint Update" ON public.complaints FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 4. scheme_applications (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public.scheme_applications;

CREATE POLICY "Auth Scheme Select" ON public.scheme_applications FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Scheme Delete" ON public.scheme_applications FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Scheme Insert" ON public.scheme_applications FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.schemes WHERE id = scheme_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Scheme Update" ON public.scheme_applications FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.schemes WHERE id = scheme_id)
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 5. sadasya (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.sadasya ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.sadasya;
DROP POLICY IF EXISTS "Enable read access for all users of same tenant" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.sadasya;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.sadasya;

CREATE POLICY "Auth Sadasya Select" ON public.sadasya FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Sadasya Delete" ON public.sadasya FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Sadasya Insert" ON public.sadasya FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (linked_voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id = linked_voter_id))
);
CREATE POLICY "Auth Sadasya Update" ON public.sadasya FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (linked_voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id = linked_voter_id))
);


-- --------------------------------------------------------
-- 6. voter_applications (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.voter_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable read access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Enable update access for tenant users" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.voter_applications;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.voter_applications;

CREATE POLICY "Auth VA Select" ON public.voter_applications FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth VA Delete" ON public.voter_applications FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth VA Insert" ON public.voter_applications FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth VA Update" ON public.voter_applications FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 7. letter_requests (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Letters" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.letter_requests;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.letter_requests;

CREATE POLICY "Auth Letter Select" ON public.letter_requests FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Letter Delete" ON public.letter_requests FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth Letter Insert" ON public.letter_requests FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);
CREATE POLICY "Auth Letter Update" ON public.letter_requests FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND (voter_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.voters WHERE id::text = voter_id::text))
);


-- --------------------------------------------------------
-- 8. work_tracker_history (Auth only)
-- --------------------------------------------------------
ALTER TABLE public.work_tracker_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert work tracker history for their tenant" ON public.work_tracker_history;
DROP POLICY IF EXISTS "Users can see their tenant's work tracker history" ON public.work_tracker_history;

CREATE POLICY "Auth WTH Select" ON public.work_tracker_history FOR SELECT TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth WTH Delete" ON public.work_tracker_history FOR DELETE TO authenticated USING (tenant_id IN (SELECT public.get_authorized_tenants()));
CREATE POLICY "Auth WTH Insert" ON public.work_tracker_history FOR INSERT TO authenticated 
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.work_trackers WHERE id = work_tracker_id)
);
CREATE POLICY "Auth WTH Update" ON public.work_tracker_history FOR UPDATE TO authenticated 
USING (tenant_id IN (SELECT public.get_authorized_tenants()))
WITH CHECK (
  tenant_id IN (SELECT public.get_authorized_tenants())
  AND tenant_id = (SELECT tenant_id FROM public.work_trackers WHERE id = work_tracker_id)
);
