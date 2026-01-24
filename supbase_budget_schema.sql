-- Create table for Ward Budget
create table if not exists ward_budget (
  id uuid default gen_random_uuid() primary key,
  financial_year text not null, -- e.g. '2024-2025'
  category text not null, -- e.g. 'Roads', 'Water Supply', 'Drainage'
  total_allocation numeric default 0,
  utilized_amount numeric default 0,
  status text default 'Active', -- 'Active', 'Closed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table ward_budget enable row level security;

-- Policies
create policy "Enable read access for all users" on ward_budget for select using (true);
create policy "Enable insert for authenticated users only" on ward_budget for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on ward_budget for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on ward_budget for delete using (auth.role() = 'authenticated');
