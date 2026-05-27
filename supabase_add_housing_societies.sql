-- ====================================================================
-- SUPABASE MIGRATION: CREATE HOUSING SOCIETIES TABLE
-- ====================================================================
-- Copy and run the following query in your Supabase SQL Editor to enable 
-- Housing Societies, Chairman/Secretary details, and Voter Counts tracking!

CREATE TABLE IF NOT EXISTS public.housing_societies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    
    name TEXT NOT NULL,
    name_marathi TEXT,
    name_english TEXT,
    
    chairman_name TEXT,
    chairman_mobile TEXT,
    secretary_name TEXT,
    secretary_mobile TEXT,
    voter_count INTEGER DEFAULT 0,
    favourable_voter_count INTEGER DEFAULT 0,
    area TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active' -- 'Active', 'Inactive'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.housing_societies ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid collision
DROP POLICY IF EXISTS "Enable all access for authenticated users on housing_societies" ON public.housing_societies;

-- Create policy to allow authenticated users to access and modify data
CREATE POLICY "Enable all access for authenticated users on housing_societies"
ON public.housing_societies FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.housing_societies IS 'Table to track local Co-operative Housing Societies, their executive bodies (Chairman & Secretary), and voter metrics.';
