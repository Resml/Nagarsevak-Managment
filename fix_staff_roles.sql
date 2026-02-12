-- Fix existing users in user_tenant_mapping
-- If the role is NOT 'admin', set it to 'staff' to ensure permission checks work correctly.
-- This preserves the 'admin' (Nagarsevak) role but resets all custom staff roles (like 'Office Admin') 
-- to the system role 'staff' in the mapping table. 
-- The descriptive role is still preserved in the 'staff' table.

UPDATE public.user_tenant_mapping
SET role = 'staff'
WHERE role != 'admin';
