-- Add SELECT policy for public.features to allow authenticated users to read it.
-- This is necessary so the frontend can inner join features when fetching overrides.

CREATE POLICY "Features are globally readable by authenticated users"
ON "public"."features"
FOR SELECT
TO authenticated
USING (true);
