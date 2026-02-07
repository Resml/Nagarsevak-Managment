-- FIX SCRIPT: Missing Default Tenant & RLS Issues
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Ensure Default Tenant Exists
-- The previous script might have failed before inserting this
insert into tenants (name, subdomain, config)
select 'Default Nagarsevak', 'default', '{}'::jsonb
where not exists (
    select 1 from tenants where subdomain = 'default'
);

-- 2. Fix RLS Policy for Tenants
-- Issue: The previous policy only allowed logged-in users to see the tenant.
-- But the app needs to load the tenant *before* login (to know which tenant it is).
-- Fix: Allow public read access to tenants table.

drop policy if exists "Users can read own tenant" on tenants;
drop policy if exists "Public read access to tenants" on tenants;

create policy "Public read access to tenants"
on tenants for select
using (true); -- Allow everyone to read tenant details (Name, Config)

-- 3. Fix RLS Policy for User Mapping
-- Ensure users can read their own mapping
drop policy if exists "Users can read own tenant mapping" on user_tenant_mapping;

create policy "Users can read own tenant mapping"
on user_tenant_mapping for select
using (auth.uid() = user_id);

-- 4. Grant Usage on Public Schema (Just in case)
grant usage on schema public to anon, authenticated;
grant select on table tenants to anon, authenticated;
