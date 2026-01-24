-- Add image_url to complaints if not exists
alter table complaints add column if not exists image_url text;

-- Create Storage Bucket for Photos
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'complaint-photos' );

create policy "Anon Upload"
on storage.objects for insert
to anon
with check ( bucket_id = 'complaint-photos' );
