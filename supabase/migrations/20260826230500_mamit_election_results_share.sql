-- Migration: Share Krishnaniti Election Results with Mamit (Read-Only)

-- Create a targeted SELECT policy that allows users of the Mamit tenant 
-- to read the election_results belonging to the Krishnaniti tenant.
DROP POLICY IF EXISTS "Mamit can read Krishnaniti election_results" ON public.election_results;
CREATE POLICY "Mamit can read Krishnaniti election_results"
ON public.election_results
FOR SELECT
TO authenticated
USING (
  election_results.tenant_id = 'bf4c7152-6006-41b5-9c7d-84c76ea67da4'::uuid
  AND EXISTS (
    SELECT 1 FROM public.user_tenant_mapping utm
    WHERE utm.user_id = auth.uid() 
    AND utm.tenant_id = 'e5a973bb-54de-4a92-bd17-91a97d7fefc3'::uuid
  )
);
