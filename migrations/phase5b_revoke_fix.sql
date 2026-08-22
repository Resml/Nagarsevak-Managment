-- =============================================================================
-- Phase 5B — Corrective REVOKE Fix
-- File: phase5b_revoke_fix.sql
--
-- PURPOSE:
--   The Phase 5B migration did NOT include REVOKE statements for the three
--   SECURITY DEFINER functions. This file applies the minimal corrective fix.
--
-- WHAT THIS DOES:
--   1. Revokes PUBLIC EXECUTE from has_member_feature_access (REQUIRED)
--   2. Revokes PUBLIC EXECUTE from both trigger functions (defence-in-depth)
--   3. Re-grants EXECUTE on has_member_feature_access to authenticated and
--      service_role (required for RLS policies to call it)
--   4. Trigger functions do NOT need explicit GRANT — the DB engine fires them
--      in SECURITY DEFINER context regardless of client EXECUTE privilege.
--
-- WHAT THIS DOES NOT DO:
--   - Does NOT modify any table policies
--   - Does NOT modify any triggers
--   - Does NOT modify any table schemas
--   - Does NOT touch Phase 2/3/3B/4 objects
--
-- EXECUTION: Authorize ONLY after TEST 7 reports anon_execute = TRUE.
-- =============================================================================

BEGIN;

-- Step 1: Revoke PUBLIC EXECUTE from the critical gate function
REVOKE ALL ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) FROM PUBLIC;

-- Step 2: Re-grant to the roles that legitimately need it
--   authenticated  → required so RLS policies (called as authenticated) invoke it
--   service_role   → required for bot/service operations
GRANT EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT) TO service_role;

-- Step 3: Defence-in-depth — revoke PUBLIC from trigger functions
--   (These are invoked by the DB trigger engine, not by client roles.
--    Revoking from PUBLIC is best practice even though it is lower risk.)
REVOKE ALL ON FUNCTION public.validate_staff_permissions_entitlement() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_staff_permission_escalation() FROM PUBLIC;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERY (run after COMMIT to confirm)
-- =============================================================================
SELECT
    p.proname                                                          AS function_name,
    pg_get_function_identity_arguments(p.oid)                         AS identity_arguments,
    p.prosecdef                                                        AS security_definer,
    p.proacl                                                           AS proacl,
    has_function_privilege('anon',          p.oid, 'execute')          AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute')          AS authenticated_execute,
    has_function_privilege('service_role',  p.oid, 'execute')          AS service_role_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'has_member_feature_access',
    'validate_staff_permissions_entitlement',
    'prevent_staff_permission_escalation'
  )
ORDER BY p.proname;
-- Expected:
--   has_member_feature_access         | anon=false | authenticated=true  | service_role=true
--   validate_staff_permissions_...    | anon=false | authenticated=false | service_role=false
--   prevent_staff_permission_...      | anon=false | authenticated=false | service_role=false
