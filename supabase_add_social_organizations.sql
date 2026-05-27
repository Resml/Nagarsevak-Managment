-- ====================================================================
-- SUPABASE MIGRATION: CREATE SOCIAL ORGANIZATIONS TABLE
-- ====================================================================
-- Copy and run the following query in your Supabase SQL Editor to enable 
-- NGOs, Cricket Clubs, and Ganpati Mandals tracking!

CREATE TABLE IF NOT EXISTS public.social_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    
    name TEXT NOT NULL,
    name_marathi TEXT,
    name_english TEXT,
    
    type TEXT NOT NULL, -- 'ngo', 'sports_cricket', 'ganpati_mandal', 'navratri_mandal', 'other'
    president_name TEXT,
    president_mobile TEXT,
    members_count INTEGER DEFAULT 0,
    area TEXT,
    established_year INTEGER,
    support_received TEXT,
    events_conducted JSONB DEFAULT '[]'::JSONB,
    description TEXT,
    status TEXT DEFAULT 'Active' -- 'Active', 'Inactive'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.social_organizations ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid collision
DROP POLICY IF EXISTS "Enable all access for authenticated users on social_organizations" ON public.social_organizations;

-- Create policy to allow authenticated users to access and modify data
CREATE POLICY "Enable all access for authenticated users on social_organizations"
ON public.social_organizations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.social_organizations IS 'Table to track local NGOs, Sports/Cricket Clubs, and Ganpati Mandals and their activities/support.';
