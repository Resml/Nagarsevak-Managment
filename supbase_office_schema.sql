-- Create Visitors Table
create table if not exists visitors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text,
  purpose text, -- e.g. 'Complaint', 'Meeting', 'Greeting'
  remarks text,
  visit_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'Visited' -- 'Visited', 'Waiting'
);

-- Enable RLS
alter table visitors enable row level security;

-- Policies
create policy "Public Access Visitors"
on visitors for all
to public
using ( true )
with check ( true );
