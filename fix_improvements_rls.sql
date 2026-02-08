-- Fix RLS policy for improvements table
-- Allow authenticated users to insert logic
DROP POLICY IF EXISTS "Allow authenticated insert improvements" ON improvements;
CREATE POLICY "Allow authenticated insert improvements" ON "public"."improvements"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update logic (for voting)
DROP POLICY IF EXISTS "Allow authenticated update improvements" ON improvements;
CREATE POLICY "Allow authenticated update improvements" ON "public"."improvements"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to select logic
DROP POLICY IF EXISTS "Allow authenticated select improvements" ON improvements;
CREATE POLICY "Allow authenticated select improvements" ON "public"."improvements"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);
