-- phase5b_select_delete_preflight.sql
-- Run this BEFORE the SELECT/DELETE migration to confirm the 10 legacy ALL policies exist.
-- This is a pure read-only query.

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    roles, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'ALL'
  AND policyname IN (
      'Allow all for everyone',
      'Enable all access for authenticated users on housing_societies',
      'Public Access Letters',
      'Public Access Letter Types',
      'letter_types_tenant_isolation',
      'personal_requests_tenant_isolation',
      'Enable all access for authenticated users',
      'Enable all access for authenticated users on social_organizatio',
      'Public Access Visitors'
  )
ORDER BY tablename, policyname;
