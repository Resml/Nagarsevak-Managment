-- Add SELECT policy for tenant_feature_overrides so frontend can read them natively
-- using the get_authorized_tenants() helper. This enforces that users can only read
-- their own tenant's overrides, and strictly prevents INSERT/UPDATE/DELETE.

CREATE POLICY "Users can view feature overrides for their tenants" 
ON "public"."tenant_feature_overrides" 
FOR SELECT 
TO authenticated 
USING (
    "tenant_id" IN (SELECT "public"."get_authorized_tenants"())
);
