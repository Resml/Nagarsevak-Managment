-- Create a table to store WhatsApp session data
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    session_id TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (session_id, id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users (or service role)
-- Adjust this based on your actual security requirements
CREATE POLICY "Allow all access to whatsapp_sessions"
ON whatsapp_sessions
FOR ALL
USING (true)
WITH CHECK (true);
