-- =============================================================================
-- Phase 5B -- Corrected REVOKE Fix
-- File: phase5b_revoke_fix_corrected.sql
--
-- DIAGNOSIS SUMMARY:
--   The Phase 5B migration (phase5b_rbac_migration.sql) was executed successfully
--   but contained zero REVOKE or GRANT statements for the three SECURITY DEFINER
--   functions. As a result, proacl IS NULL for all three functions, which means
--   PostgreSQL default privileges apply: PUBLIC (including anon) has EXECUTE.
--
-- WHY THE PREVIOUS REVOKE FILE WAS NOT WRONG (but was not executed):
--   phase5b_revoke_fix.sql used:
--     REVOKE ALL ON FUNCTION public.has_member_feature_access(UUID, UUID, TEXT)
--   This is valid PostgreSQL syntax. PostgreSQL REVOKE resolves functions by
--   type only, ignoring parameter names, and is case-insensitive for type names.
--   UUID = uuid. The REVOKE would have targeted the correct function.
--   It was simply never applied to production.
--
-- WHY Q5 DIAGNOSTIC REPORTED MISMATCH:
--   The Q5 check compared pg_get_function_identity_arguments(oid) against the
--   hardcoded string 'uuid, uuid, text' (types only, no names).
--   Supabase's PostgreSQL returns the NAMED form:
--     'p_tenant_id uuid, p_user_id uuid, p_feature_key text'
--   The comparison failed because of the diagnostic's hardcoded string, NOT
--   because the REVOKE syntax was wrong. The REVOKE (UUID, UUID, TEXT) is
--   correct and resolves to the same function.
--
-- REQUIRED FINAL STATE:
--   has_member_feature_access:
--     PUBLIC / anon         --> NO EXECUTE
--     authenticated         --> EXECUTE (required for RLS policies)
--     service_role          --> EXECUTE (required for bot/service operations)
--   validate_staff_permissions_entitlement:
--     PUBLIC / anon         --> NO EXECUTE  (trigger fn, defence-in-depth)
--   prevent_staff_permission_escalation:
--     PUBLIC / anon         --> NO EXECUTE  (trigger fn, defence-in-depth)
--
-- WHAT THIS SCRIPT DOES:
--   1. Revokes ALL privileges on has_member_feature_access from PUBLIC
--   2. Re-grants EXECUTE to authenticated and service_role
--   3. Revokes ALL from PUBLIC on the two trigger functions (defence-in-depth)
--      Trigger functions do not need client EXECUTE; DB engine fires them.
--   4. NO other objects are touched.
--   5. Does NOT modify tables, policies, triggers, schemas, or other functions.
--
-- SAFE TO APPLY:
--   - No schema changes
--   - No data changes
--   - No policy modifications
--   - Zero risk to Phase 2/3/3B/4 boundaries
--   - Fully reversible: GRANT EXECUTE ON FUNCTION ... TO PUBLIC
--
-- DO NOT EXECUTE until Phase 5B privilege fix is explicitly authorized.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 1: has_member_feature_access -- critical SECURITY DEFINER gate function
--
-- PostgreSQL resolves REVOKE by type signature (case-insensitive, names ignored).
-- Both these forms are equivalent and either will work:
--   (UUID, UUID, TEXT)
--   (uuid, uuid, text)
--   (p_tenant_id uuid, p_user_id uuid, p_feature_key text)
--
-- Using lowercase to match pg_get_function_identity_arguments() output convention.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.has_member_feature_access(uuid, uuid, text) FROM PUBLIC;

-- Re-grant to roles that need it:
--   authenticated: RLS policies call this function in authenticated context
--   service_role:  Bot / service operations need to invoke it
GRANT EXECUTE ON FUNCTION public.has_member_feature_access(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_member_feature_access(uuid, uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- STEP 2: validate_staff_permissions_entitlement -- trigger function
--
-- Trigger functions are invoked by the PostgreSQL trigger engine, not by client
-- roles directly. Client EXECUTE privilege is irrelevant for trigger invocation.
-- Revoking from PUBLIC is defence-in-depth only -- it cannot be called remotely
-- by an authenticated client even with EXECUTE, because it has no meaningful
-- return type outside a trigger context. Revoke anyway per security baseline.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.validate_staff_permissions_entitlement() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- STEP 3: prevent_staff_permission_escalation -- trigger function
-- Same reasoning as Step 2.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.prevent_staff_permission_escalation() FROM PUBLIC;

COMMIT;

-- =============================================================================
-- IMMEDIATE POST-APPLY VERIFICATION
-- Run this SELECT immediately after COMMIT to confirm the privilege state.
-- Expected results:
--   has_member_feature_access         | anon=false | auth=true  | svc=true
--   validate_staff_permissions_...    | anon=false | auth=false | svc=false
--   prevent_staff_permission_...      | anon=false | auth=false | svc=false
-- =============================================================================
SELECT
    p.proname                                                           AS function_name,
    pg_get_function_identity_arguments(p.oid)                          AS live_signature,
    p.proacl                                                            AS proacl_after_fix,
    has_function_privilege('anon',          p.oid, 'execute')           AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute')           AS authenticated_execute,
    has_function_privilege('service_role',  p.oid, 'execute')           AS service_role_execute,
    CASE
        WHEN p.proname = 'has_member_feature_access'
          AND NOT has_function_privilege('anon',          p.oid, 'execute')
          AND     has_function_privilege('authenticated', p.oid, 'execute')
          AND     has_function_privilege('service_role',  p.oid, 'execute')
        THEN 'CORRECT'
        WHEN p.proname != 'has_member_feature_access'
          AND NOT has_function_privilege('anon',          p.oid, 'execute')
        THEN 'CORRECT (trigger fn)'
        ELSE 'INCORRECT -- INVESTIGATE'
    END AS privilege_state
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'has_member_feature_access',
      'validate_staff_permissions_entitlement',
      'prevent_staff_permission_escalation'
  )
ORDER BY p.proname;
