-- Create Staff Table
create table if not exists staff (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text not null,
  role text not null,
  keywords text[] default '{}', -- Keywords for auto-assignment
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table staff enable row level security;

-- Policies
create policy "Public Access Staff"
on staff for select
to public
using ( true );

create policy "Admin Manage Staff"
on staff for all
to anon
using ( true )
with check ( true );

-- Link Complaints to Staff
alter table complaints add column if not exists assigned_to uuid references staff(id);
