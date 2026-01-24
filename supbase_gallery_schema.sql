-- Create table for Gallery
create table if not exists gallery (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null, -- 'Event', 'Work', 'Award', 'Newspaper'
  image_url text not null,
  description text,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table gallery enable row level security;

-- Policies
create policy "Enable read access for all users" on gallery for select using (true);
create policy "Enable insert for authenticated users only" on gallery for insert with check (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on gallery for delete using (auth.role() = 'authenticated');
