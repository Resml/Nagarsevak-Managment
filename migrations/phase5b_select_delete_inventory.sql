-- phase5b_select_delete_inventory.sql
-- Extracts the 18 legacy permissive SELECT/DELETE policies that need to be dropped,
-- explicitly filtering OUT the 18 newly verified strict 'Tenant Select/Delete' policies.

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
  AND cmd IN ('SELECT', 'DELETE')
  AND tablename IN (
      'gb_diary', 'housing_societies', 'letter_requests', 'letter_types',
      'personal_requests', 'sadasya', 'social_organizations', 'surveys', 'visitors'
  )
  -- EXCLUDE the 18 officially verified strict replacement policies
  AND policyname NOT IN (
      'Tenant Select gb_diary', 'Tenant Delete gb_diary',
      'Tenant Select housing_societies', 'Tenant Delete housing_societies',
      'Auth Letter Select', 'Auth Letter Delete',
      'Tenant Select letter_types', 'Tenant Delete letter_types',
      'Tenant Select personal_requests', 'Tenant Delete personal_requests',
      'Auth Sadasya Select', 'Auth Sadasya Delete',
      'Tenant Select social_organizations', 'Tenant Delete social_organizations',
      'Tenant Select surveys', 'Tenant Delete surveys',
      'Tenant Select visitors', 'Tenant Delete visitors',
      'Anon Survey Select' -- Keep the verified anon select exception
  )
ORDER BY tablename, cmd, policyname;
