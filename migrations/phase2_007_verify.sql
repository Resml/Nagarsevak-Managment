-- Phase 2 - 007 - Post-Migration Verification
-- This read-only query outputs the final state of all RLS policies.
-- Use this to confirm that no insecure or legacy policies remain.

SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd as operation, 
    qual as using_condition, 
    with_check as check_condition
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, 
    policyname;
