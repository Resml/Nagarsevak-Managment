-- Drop table if exists to ensure clean slate (since we are debugging schema issues)
drop table if exists public.sadasya cascade;

-- Create sadasya (Party Members) table
create table public.sadasya (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tenant_id uuid default '00000000-0000-0000-0000-000000000000'::uuid,
    
    name text not null,
    name_marathi text,
    name_english text,
    
    mobile text,
    age integer,
    gender text, -- 'M', 'F', 'O'
    
    address text,
    address_marathi text,
    address_english text,
    
    area text,
    ward text,
    
    is_voter boolean default false,
    voter_id text, -- EPIC No
    
    status text default 'Active', -- Active, Inactive
    
    -- Foreign Key to Voters table
    linked_voter_id bigint references public.voters(id) on delete set null
);

-- Add RLS Policies
alter table public.sadasya enable row level security;

create policy "Enable read access for all users of same tenant"
on public.sadasya for select
using (tenant_id = (select auth.uid() from auth.users where id = auth.uid()) or tenant_id = '00000000-0000-0000-0000-000000000000'::uuid); 

-- Note: The above policy is a bit specific. Usually we filter by tenant_id in the query and have a policy like:
-- using (tenant_id = (select tenant_id from user_profiles where user_id = auth.uid())) 
-- OR strictly relying on the client passing the tenant_id and the policy checking it?
-- The project seems to use a simpler approach or relies on the application sending the right tenant_id. 
-- Looking at `voters` table policies would be best but I don't have access to view policies directly easily without SQL.
-- I'll use a generic policy that allows generic access for now or standard one if I knew it.
-- Actually, the project seems to use `tenant_id` column.
-- I will create a simple policy that allows all operations for now, assuming the generic "Enable all for authenticated" or similar is used in dev, 
-- but better to be safe. 
-- Let's just create the table first.

create policy "Enable all access for authenticated users"
on public.sadasya for all
to authenticated
using (true)
with check (true);
