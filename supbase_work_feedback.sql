-- Create a table for Work Feedback
create table work_feedback (
  id uuid default uuid_generate_v4() primary key,
  work_id text not null, -- Stores 'work-123' or 'comp-456' ID format used in frontend
  citizen_name text, -- Optional, if we want to track who gave feedback
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table work_feedback enable row level security;

-- Policy: Anyone can read feedback (public transparency)
create policy "Public can view feedback"
  on work_feedback for select
  using ( true );

-- Policy: Anyone can insert feedback (simulating public bot interaction)
create policy "Public can submit feedback"
  on work_feedback for insert
  with check ( true );
