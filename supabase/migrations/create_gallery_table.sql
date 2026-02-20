CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  date TEXT, -- or DATE, using TEXT to match other tables safely based on input type
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative')),
  title_key TEXT,
  description_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: we use TEXT for date because it corresponds to ISO strings like 'YYYY-MM-DD' from the frontend

-- Enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (as per application requirements, usually authenticated only but since anon key is used for all actions right now)
CREATE POLICY "Allow anon read access" ON gallery FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON gallery FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete access" ON gallery FOR DELETE USING (true);
