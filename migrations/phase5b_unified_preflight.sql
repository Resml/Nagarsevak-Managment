-- phase5b_unified_preflight.sql
-- READ-ONLY inventory of all policies on letter_requests, sadasya, letter_types, personal_requests
-- Run this to confirm the exact state before migration generation.

SELECT
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('letter_requests', 'sadasya', 'letter_types', 'personal_requests')
ORDER BY tablename, cmd, policyname;
