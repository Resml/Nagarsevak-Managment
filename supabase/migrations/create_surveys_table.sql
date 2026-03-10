-- Drop table if exists to ensure clean slate
drop table if exists public.surveys cascade;

-- Create surveys table
create table public.surveys (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tenant_id uuid default '00000000-0000-0000-0000-000000000000'::uuid,
    
    title text not null,
    description text,
    area text,
    
    status text default 'Draft', -- Draft, Active, Closed
    
    questions jsonb default '[]'::jsonb, -- Store questions as JSON array
    
    target_sample_size integer default 0
);

-- Add RLS Policies
alter table public.surveys enable row level security;

create policy "Enable all access for authenticated users"
on public.surveys for all
to authenticated
using (true)
with check (true);
