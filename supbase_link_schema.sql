-- Add voter_id to complaints
alter table complaints 
add column if not exists voter_id bigint references voters(id);

-- Optional: Add valid foreign key constraint if strict integrity desired, but keeping it loose is safer for now
-- alter table complaints add constraint fk_voter foreign key (voter_id) references voters(id);
