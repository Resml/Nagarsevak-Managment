-- Function to get unique castes with voter count
create or replace function get_unique_castes()
returns table (caste text, count bigint)
language plpgsql
as $$
begin
  return query
  select 
    voters.caste,
    count(*) as count
  from voters
  where voters.caste is not null and voters.caste != ''
  group by voters.caste
  having count(*) > 0
  order by count desc;
end;
$$;
