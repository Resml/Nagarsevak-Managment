-- =============================================================================
-- Phase 5B -- FINAL READ-ONLY CONFIRMATION
-- File: phase5b_final_privilege_check.sql
--
-- PURPOSE:
--   Provide the final read-only confirmation of function signatures, exact 
--   privileges, and policy call sites before authorizing the corrective SQL.
--
-- SAFE: Read-only. Zero DDL, DML, REVOKE, GRANT, or ALTER statements.
-- =============================================================================

-- 1. Exact pg_proc row for: public.has_member_feature_access
SELECT 
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS identity_args,
    pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef,
    p.proconfig,
    p.proacl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'has_member_feature_access';

-- 2 & 3. Explicit privilege matrix for all three Phase 5B functions
SELECT 
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS identity_args,
    has_function_privilege('public', p.oid, 'execute') AS public_execute,
    has_function_privilege('anon', p.oid, 'execute') AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute') AS authenticated_execute,
    has_function_privilege('service_role', p.oid, 'execute') AS service_role_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'has_member_feature_access',
      'validate_staff_permissions_entitlement',
      'prevent_staff_permission_escalation'
  )
ORDER BY p.proname;

-- 4. Confirm the Phase 5B RLS policies call: public.has_member_feature_access(tenant_id, auth.uid(), feature_key)
-- We count them and show a sample to confirm the exact call pattern.
SELECT 
    COUNT(*) AS policy_count,
    MAX(qual) AS sample_qual,
    MAX(with_check) AS sample_with_check
FROM pg_policies
WHERE qual LIKE '%has_member_feature_access%' 
   OR with_check LIKE '%has_member_feature_access%';
