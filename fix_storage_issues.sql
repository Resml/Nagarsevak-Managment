-- FIX: Create missing storage bucket and policies
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'app-assets', 'app-assets', true
where not exists (
    select 1 from storage.buckets where id = 'app-assets'
);

-- 2. Allow Public Access to view files
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'app-assets' );

-- 3. Allow Authenticated Users to Upload
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'app-assets' and auth.role() = 'authenticated' );

-- 4. Allow Authenticated Users to Update/Delete their own uploads (optional but good)
drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'app-assets' and auth.uid() = owner );

-- 5. (Optional) Allow Anon uploads if needed for public forms, otherwise skip
-- create policy "Anon Upload" ...
