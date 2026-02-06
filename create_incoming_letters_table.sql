-- Create incoming_letters table for storing scanned incoming letters
CREATE TABLE IF NOT EXISTS incoming_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    scanned_file_url TEXT NOT NULL,
    file_type VARCHAR(50),  -- 'pdf', 'image/jpeg', 'image/png', etc.
    received_date TIMESTAMP DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    area TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE incoming_letters ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all incoming letters
CREATE POLICY "Allow authenticated users to read incoming letters"
ON incoming_letters
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert incoming letters
CREATE POLICY "Allow authenticated users to insert incoming letters"
ON incoming_letters
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow users to update their own incoming letters
CREATE POLICY "Allow users to update own incoming letters"
ON incoming_letters
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

-- Policy: Allow users to delete their own incoming letters
CREATE POLICY "Allow users to delete own incoming letters"
ON incoming_letters
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_incoming_letters_area ON incoming_letters(area);
CREATE INDEX IF NOT EXISTS idx_incoming_letters_created_at ON incoming_letters(created_at DESC);
