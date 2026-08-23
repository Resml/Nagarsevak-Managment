-- Phase 3B: Public Intake Security Fixes

BEGIN;

-- 1. Create explicitly constrained read policy for anonymous users on the surveys table.
--    This exposes ONLY surveys that are intentionally marked as 'Active'.
CREATE POLICY "Anon Survey Select" ON public.surveys
FOR SELECT TO anon
USING (status = 'Active');

-- 2. Create a BEFORE INSERT trigger to automatically and securely derive the tenant_id 
--    for anonymous survey responses. This prevents anonymous users from needing to 
--    supply or guess a tenant_id, enforcing derivation directly from the active survey.
CREATE OR REPLACE FUNCTION public.derive_survey_response_tenant()
RETURNS trigger AS $$
BEGIN
    -- Force the tenant_id to exactly match the survey's tenant.
    -- get_survey_tenant() also securely verifies that the survey is 'Active'.
    NEW.tenant_id := public.get_survey_tenant(NEW.survey_id);
    
    IF NEW.tenant_id IS NULL THEN
        RAISE EXCEPTION 'Survey is inactive or invalid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_derive_survey_response_tenant ON public.survey_responses;
CREATE TRIGGER trg_derive_survey_response_tenant
BEFORE INSERT ON public.survey_responses
FOR EACH ROW
EXECUTE FUNCTION public.derive_survey_response_tenant();

COMMIT;
