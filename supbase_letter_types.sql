-- Create Letter Types Table
create table if not exists letter_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table letter_types enable row level security;

-- Policies (Public can read, Auth can insert/delete - for MVP allowing public insert for demo convenience if needed, but restricting to anon true for now)
create policy "Public Access Letter Types"
on letter_types for all
to public
using ( true )
with check ( true );

-- Seed Data (Initial Default Types)
insert into letter_types (name) values 
('Residential Certificate'),
('Character Certificate'),
('No Objection Certificate (NOC)'),
('Income Certificate Recommendation'),
('Other')
on conflict (name) do nothing;
