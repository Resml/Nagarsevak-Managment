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
  AND tablename = 'staff'
  AND cmd IN ('INSERT', 'UPDATE')
ORDER BY cmd, policyname;
