-- Create housing_societies table
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

-- Add RLS Policies
ALTER TABLE public.housing_societies ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to perform all operations
CREATE POLICY "Enable all access for authenticated users on housing_societies"
ON public.housing_societies FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
