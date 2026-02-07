-- FIX: Add missing 'updated_at' column to 'tenants' table
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add the column if it doesn't exist
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Create a function to auto-update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create a trigger to call the function on update
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 4. Reload schema cache (notify PostgREST)
NOTIFY pgrst, 'reload config';
