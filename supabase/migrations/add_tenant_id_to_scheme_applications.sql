-- Add tenant_id to scheme_applications
alter table public.scheme_applications 
add column if not exists tenant_id uuid references public.tenants(id);

-- Update RLS policy to scope by tenant using user_tenant_mapping
drop policy if exists "Enable all access for all users" on public.scheme_applications;
drop policy if exists "Enable all access for tenant users" on public.scheme_applications;

create policy "Enable all access for tenant users" on public.scheme_applications
for all using (
    tenant_id in (select tenant_id from public.user_tenant_mapping where user_id = auth.uid())
)
with check (
    tenant_id in (select tenant_id from public.user_tenant_mapping where user_id = auth.uid())
);
