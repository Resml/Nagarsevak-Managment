-- Create gb_diary table if it doesn't exist
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

-- Enable Row Level Security (RLS)
ALTER TABLE gb_diary ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users (simplified for MVP)
CREATE POLICY "Enable all for authenticated users" ON gb_diary
    FOR ALL USING (auth.role() = 'authenticated');

-- Also allow public access if needed for dev (optional, comment out if strict)
CREATE POLICY "Enable read access for all users" ON gb_diary
    FOR SELECT USING (true);
