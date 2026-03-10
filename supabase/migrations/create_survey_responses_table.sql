-- Drop table if exists to ensure clean slate
drop table if exists public.survey_responses cascade;

-- Create survey_responses table
create table public.survey_responses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tenant_id uuid default '00000000-0000-0000-0000-000000000000'::uuid,
    
    survey_id uuid references public.surveys(id) on delete cascade not null,
    voter_id bigint references public.voters(id) on delete set null,
    
    answers jsonb default '{}'::jsonb not null
);

-- Add RLS Policies
alter table public.survey_responses enable row level security;

-- Allow authenticated users to view all responses in their tenant (handled by view layers)
create policy "Enable select for authenticated users"
on public.survey_responses for select
to authenticated
using (true);

-- Allow authenticated users to insert responses 
create policy "Enable insert for authenticated users"
on public.survey_responses for insert
to authenticated
with check (true);

-- Allow public inserts since citizens might be answering these from un-authenticated sessions via magic links
create policy "Enable insert for public"
on public.survey_responses for insert
to anon
with check (true);

-- Allow anon to select (so we can check if they already took it)
create policy "Enable select for public"
on public.survey_responses for select
to anon
using (true);
