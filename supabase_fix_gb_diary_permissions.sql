-- Ensure table exists
CREATE TABLE IF NOT EXISTS gb_diary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_date DATE,
    meeting_type TEXT,
    subject TEXT,
    description TEXT,
    department TEXT,
    status TEXT DEFAULT 'Raised',
    response TEXT,
    tags TEXT[] DEFAULT '{}',
    area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Grant explicit access to standard Supabase roles
GRANT ALL ON TABLE gb_diary TO anon;
GRANT ALL ON TABLE gb_diary TO authenticated;
GRANT ALL ON TABLE gb_diary TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE gb_diary ENABLE ROW LEVEL SECURITY;

-- Remove any restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all for authenticated users" ON gb_diary;
DROP POLICY IF EXISTS "Enable read access for all users" ON gb_diary;
DROP POLICY IF EXISTS "Allow all for everyone" ON gb_diary;

-- Create a permissive policy for development (allows SELECT, INSERT, UPDATE, DELETE to everyone)
CREATE POLICY "Allow all for everyone" ON gb_diary
    FOR ALL USING (true) WITH CHECK (true);
