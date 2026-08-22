-- phase5b_survey_responses_preflight.sql
-- Read-only query to view the exact definitions of the policies targeted for removal.

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
  AND tablename = 'survey_responses'
  AND policyname IN (
      'Enable insert for authenticated users',
      'Enable insert for public'
  )
ORDER BY policyname;
