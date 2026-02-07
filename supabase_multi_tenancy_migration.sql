-- MULTI-TENANCY MIGRATION SCRIPT
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR

-- 1. Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 2. Create Tenants Table (Stores Nagarsevak Details)
create table if not exists tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subdomain text unique not null, -- e.g. 'shinde', 'patil'
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Link Users to Tenants (User Tenant Mapping)
-- This links an Auth User (email login) to a specific Nagarsevak Tenant
create table if not exists user_tenant_mapping (
  user_id uuid references auth.users(id) on delete cascade primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  role text default 'staff', -- 'admin', 'staff', 'viewer'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on new tables
alter table tenants enable row level security;
alter table user_tenant_mapping enable row level security;

-- Policies for Tenants/Mapping
create policy "Users can read own tenant mapping"
  on user_tenant_mapping for select
  using (auth.uid() = user_id);

create policy "Users can read own tenant"
  on tenants for select
  using (
    id in (
      select tenant_id from user_tenant_mapping where user_id = auth.uid()
    )
  );

-- 4. Temporary: Create a Default Tenant
-- We need this so we can assign all existing data to a "Default" tenant.
do $$
declare
  default_tenant_id uuid;
begin
  if not exists (select 1 from tenants where subdomain = 'default') then
    insert into tenants (name, subdomain) values ('Default Nagarsevak', 'default') returning id into default_tenant_id;
  else
    select id into default_tenant_id from tenants where subdomain = 'default' limit 1;
  end if;
  
  -- Store this ID in a temporary variable if needed, or we just query it below
end;
$$;

-- 5. Add tenant_id to existing tables and enable isolation

-- Helper function to migrate a table
create or replace function migrate_table_to_multitenant(table_name text)
returns void as $$
declare
  default_tenant_id uuid;
begin
  -- Check if table exists
  if to_regclass(table_name) is null then
    raise notice 'Table % does not exist, skipping migration.', table_name;
    return;
  end if;

  -- Get default tenant
  select id into default_tenant_id from tenants where subdomain = 'default' limit 1;

  -- Add Column
  execute format('alter table %I add column if not exists tenant_id uuid references tenants(id);', table_name);
  
  -- Assign existing data to default tenant
  execute format('update %I set tenant_id = %L where tenant_id is null;', table_name, default_tenant_id);
  
  -- Make it NOT NULL after backfilling (Optional, but good for integrity)
  -- execute format('alter table %I alter column tenant_id set not null;', table_name);

  -- Enable RLS
  execute format('alter table %I enable row level security;', table_name);

  -- RLS: SELECT (Read)
  execute format('drop policy if exists "Tenant Isolation Select" on %I;', table_name);
  execute format('create policy "Tenant Isolation Select" on %I for select using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    or 
    (auth.role() = ''anon'' and tenant_id is not null) -- For public pages to work (logic to be refined via frontend)
  );', table_name, table_name);

  -- RLS: INSERT (Create)
  execute format('drop policy if exists "Tenant Isolation Insert" on %I;', table_name);
  execute format('create policy "Tenant Isolation Insert" on %I for insert with check (
    -- Allow authenticated users to insert into their mapped tenant
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
    or
    -- Allow anon users (public) to insert if they provide a valid tenant_id (e.g. Complaint Form)
    (auth.role() = ''anon'' and tenant_id is not null)
  );', table_name, table_name);
  
  -- RLS: UPDATE (Modify)
  execute format('drop policy if exists "Tenant Isolation Update" on %I;', table_name);
  execute format('create policy "Tenant Isolation Update" on %I for update using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
  );', table_name, table_name);

  -- RLS: DELETE (Remove)
  execute format('drop policy if exists "Tenant Isolation Delete" on %I;', table_name);
  execute format('create policy "Tenant Isolation Delete" on %I for delete using (
    tenant_id in (select tenant_id from user_tenant_mapping where user_id = auth.uid())
  );', table_name, table_name);
end;
$$ language plpgsql;

-- Apply migration to all relevant tables
select migrate_table_to_multitenant('voters');
select migrate_table_to_multitenant('complaints');
select migrate_table_to_multitenant('letter_requests');
select migrate_table_to_multitenant('gb_diary');
select migrate_table_to_multitenant('gallery');
select migrate_table_to_multitenant('works');
select migrate_table_to_multitenant('events');
select migrate_table_to_multitenant('schemes');
-- select migrate_table_to_multitenant('visitors'); -- If exists

-- Clean up
-- drop function migrate_table_to_multitenant(text);

-- IMPORTANT: You must manually assign your Admin User to the Default Tenant
-- Insert into user_tenant_mapping (user_id, tenant_id, role) values ('YOUR_USER_ID', 'DEFAULT_TENANT_ID', 'admin');
