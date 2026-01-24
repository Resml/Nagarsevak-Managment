-- Create Storage Bucket for Gallery
insert into storage.buckets (id, name, public)
values ('gallery-uploads', 'gallery-uploads', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access Gallery"
on storage.objects for select
to public
using ( bucket_id = 'gallery-uploads' );

create policy "Authenticated Upload Gallery"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'gallery-uploads' );

create policy "Authenticated Delete Gallery"
on storage.objects for delete
to authenticated
using ( bucket_id = 'gallery-uploads' );
