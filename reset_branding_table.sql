-- Nuke it from orbit (Reset Table)
DROP TABLE IF EXISTS app_settings CASCADE;

-- Re-create
create table app_settings (
  id bigint primary key, -- No auto-increment, we force ID=1
  nagarsevak_name_english text,
  nagarsevak_name_marathi text,
  ward_name text,
  ward_number text,
  party_name text,
  party_logo_url text,
  profile_image_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  CONSTRAINT single_row_check CHECK (id = 1) -- Enforce Singleton at DB Level
);

-- Enable RLS
alter table app_settings enable row level security;

-- Policies
create policy "Allow public read app_settings" on app_settings for select to anon, authenticated using (true);
create policy "Allow auth update app_settings" on app_settings for update to authenticated using (true);
create policy "Allow auth insert app_settings" on app_settings for insert to authenticated with check (true);

-- Insert the ONE TRUE ROW
INSERT INTO app_settings (id, nagarsevak_name_english, ward_name) 
VALUES (1, 'Nagar Sevak', 'Ward No. 1');
