-- Function to get unique addresses with voter count
create or replace function get_unique_addresses()
returns table (address text, count bigint)
language plpgsql
as $$
begin
  return query
  select 
    coalesce(address_english, address_marathi, 'Unknown') as address,
    count(*) as count
  from voters
  group by coalesce(address_english, address_marathi, 'Unknown')
  having count(*) > 0
  order by count desc;
end;
$$;

-- Function to get unique house numbers with voter count
create or replace function get_unique_house_numbers()
returns table (house_no text, count bigint)
language plpgsql
as $$
begin
  return query
  select 
    voters.house_no,
    count(*) as count
  from voters
  where voters.house_no is not null and voters.house_no != ''
  group by voters.house_no
  having count(*) > 0
  order by count desc;
end;
$$;
