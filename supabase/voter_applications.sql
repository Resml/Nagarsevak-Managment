-- Enable moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create voter_applications table
create table if not exists voter_applications (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tenant_id uuid not null,
    voter_id bigint references voters(id),
    applicant_name text not null,
    applicant_mobile text,
    form_type text not null, -- 'Form 6', 'Form 7', 'Form 8', 'Search'
    status text default 'Submitted',
    notes text,
    created_by uuid references auth.users(id)
);

-- Enable RLS
alter table voter_applications enable row level security;

-- Policies
drop policy if exists "Tenant Isolation Select" on voter_applications;
create policy "Tenant Isolation Select" on voter_applications
    for select using (
        tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
        or
        (auth.role() = 'anon' and tenant_id is not null)
    );

drop policy if exists "Tenant Isolation Insert" on voter_applications;
create policy "Tenant Isolation Insert" on voter_applications
    for insert with check (
        tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
        or
        (auth.role() = 'anon' and tenant_id is not null)
    );

drop policy if exists "Tenant Isolation Update" on voter_applications;
create policy "Tenant Isolation Update" on voter_applications
    for update using (
        tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    );

drop policy if exists "Tenant Isolation Delete" on voter_applications;
create policy "Tenant Isolation Delete" on voter_applications
    for delete using (
        tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    );

-- Add trigger for updated_at
drop trigger if exists handle_updated_at on voter_applications;
create trigger handle_updated_at before update on voter_applications
    for each row execute procedure moddatetime (updated_at);
