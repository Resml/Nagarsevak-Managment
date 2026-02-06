-- Function to get unique Marathi addresses with voter count
create or replace function get_unique_addresses_marathi()
returns table (address text, count bigint)
language plpgsql
as $$
begin
  return query
  select 
    coalesce(address_marathi, address_english, 'Unknown') as address,
    count(*) as count
  from voters
  group by coalesce(address_marathi, address_english, 'Unknown')
  having count(*) > 0
  order by count desc;
end;
$$;
