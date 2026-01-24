-- Add media columns to complaints if not exists
alter table complaints add column if not exists image_url text;
alter table complaints add column if not exists video_url text;

-- Create Storage Bucket for Media
insert into storage.buckets (id, name, public)
values ('complaint-media', 'complaint-media', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access Media"
on storage.objects for select
to public
using ( bucket_id = 'complaint-media' );

create policy "Anon Upload Media"
on storage.objects for insert
to anon
with check ( bucket_id = 'complaint-media' );
