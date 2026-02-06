-- Unlock permissions completely for debugging
-- This grants SELECT, INSERT, UPDATE, DELETE to everyone (anon + authenticated)
-- for the app_settings table only.

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow auth update app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow auth insert app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow full access app_settings" ON app_settings;

CREATE POLICY "Allow full access app_settings" 
ON app_settings 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- Ensure the row exists just in case
INSERT INTO app_settings (id, nagarsevak_name_english, ward_name) 
VALUES (1, 'Nagar Sevak', 'Ward No. 1')
ON CONFLICT (id) DO NOTHING;
