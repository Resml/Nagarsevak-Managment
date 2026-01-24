-- Create table for Election Results
create table if not exists election_results (
  id uuid default gen_random_uuid() primary key,
  ward_name text not null, -- e.g. 'Prabhag 5 A'
  booth_number text not null, -- e.g. '101'
  booth_name text,
  total_voters integer default 0,
  total_votes_casted integer default 0,
  candidate_votes jsonb default '{}'::jsonb, -- e.g. {"Mamit Chougale": 450, "XYZ": 300}
  winner text,
  margin integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table election_results enable row level security;

-- Policies
create policy "Enable read access for all users" on election_results for select using (true);
create policy "Enable insert for authenticated users only" on election_results for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on election_results for update using (auth.role() = 'authenticated');
