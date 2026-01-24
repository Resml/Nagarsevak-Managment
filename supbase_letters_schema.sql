-- Create Letter Requests Table
create table if not exists letter_requests (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- WhatsApp Number
  voter_id bigint references voters(id), -- Changed to bigint to match voters table
  type text not null, -- 'Residential', 'Character', 'NOC'
  details jsonb default '{}', -- Flexible content
  status text check (status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table letter_requests enable row level security;

-- Policies
create policy "Public Access Letters"
on letter_requests for all
to public
using ( true )
with check ( true );

-- Storage Tracking for Generated PDFs
insert into storage.buckets (id, name, public) values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Public Access Documents"
on storage.objects for all
to public
using ( bucket_id = 'documents' )
with check ( bucket_id = 'documents' );
