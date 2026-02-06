-- Enable DELETE policy for complaints table
-- Needed because the app currently uses Mock Auth, so all database requests are 'anon'
-- This allows the deletion to succeed from the frontend

create policy "Allow public delete"
on complaints for delete
to anon
using (true);

-- Ensure UPDATE is also allowed (if not already)
create policy "Allow public update"
on complaints for update
to anon
using (true);
