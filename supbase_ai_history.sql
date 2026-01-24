-- Create a table for AI Content History
create table ai_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null, -- The 'Topic'
  content_type text not null, -- Speech, Social Media Caption, etc.
  tone text,
  language text,
  generated_content text, -- The final output (legacy/simple view)
  messages jsonb, -- For full chat history: [{role: 'user', content: '...'}, {role: 'model', content: '...'}]
  created_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table ai_history enable row level security;

create policy "Users can view their own history"
  on ai_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own history"
  on ai_history for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own history"
  on ai_history for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own history"
  on ai_history for delete
  using ( auth.uid() = user_id );
