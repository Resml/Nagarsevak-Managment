-- COMPREHENSIVE FIX: Profile Save Issues
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. FIX SCHEMA: Add 'updated_at' column if missing
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. FIX AUTOMATION: Update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 3. FIX PERMISSIONS: Allow users to UPDATE their own tenant
-- Use DROP POLICY IF EXISTS to avoid errors if run multiple times
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON tenants; -- Remove if wrongly created

CREATE POLICY "Users can update own tenant"
ON tenants
FOR UPDATE
USING (
  id IN (
    SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid()
  )
);

-- 4. RELOAD CACHE
NOTIFY pgrst, 'reload config';
