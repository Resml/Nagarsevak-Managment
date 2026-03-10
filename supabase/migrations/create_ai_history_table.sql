CREATE TABLE IF NOT EXISTS ai_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  tone TEXT,
  language TEXT,
  generated_content TEXT NOT NULL,
  messages JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (as per application requirements, usually authenticated only but since anon key is used for all actions right now)
CREATE POLICY "Allow anon read access" ON ai_history FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON ai_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON ai_history FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON ai_history FOR DELETE USING (true);
