-- Phase 5B Live Diagnosis Script
-- Find the exact 2 policies that failed the verification

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
  AND cmd IN ('INSERT', 'UPDATE')
  AND policyname LIKE 'Tenant Isolation%'
  AND (qual LIKE '%auth.role() = ''anon''%' OR with_check LIKE '%auth.role() = ''anon''%')
  AND tablename NOT IN ('complaints', 'voter_applications');
