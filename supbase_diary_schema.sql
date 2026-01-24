-- Create table for Sabhasad Diary (GB Diary)
create table if not exists gb_diary (
  id uuid default gen_random_uuid() primary key,
  meeting_date date not null,
  meeting_type text not null, -- 'GB', 'Standing Committee', 'Ward Committee', 'Special GB', 'Other'
  subject text not null,
  description text,
  department text, -- 'Water', 'Road', 'Health', etc.
  status text default 'Raised', -- 'Raised', 'In Discussion', 'Resolved', 'Action Taken'
  response text, -- Official response
  tags text[], -- Array of keywords
  user_id uuid references auth.users(id), -- Link to the user who created it (optional if multi-user)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table gb_diary enable row level security;

-- Policies
create policy "Enable read access for all users" on gb_diary for select using (true);
create policy "Enable insert for authenticated users only" on gb_diary for insert with check (auth.role() = 'authenticated');
create policy "Enable update for users based on email" on gb_diary for update using (true); -- Simplified for demo
create policy "Enable delete for users based on email" on gb_diary for delete using (true); -- Simplified for demo
