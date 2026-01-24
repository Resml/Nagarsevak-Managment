-- Enable Realtime for letter_requests table
begin;
  -- Add table to publication
  alter publication supabase_realtime add table letter_requests;
  
  -- Set replica identity to FULL so we get all columns in the payload
  alter table letter_requests replica identity full;
commit;
