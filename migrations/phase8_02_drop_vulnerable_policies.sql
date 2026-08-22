-- =============================================================================
-- PHASE 8: DROP VULNERABLE POLICIES
-- =============================================================================

-- Drop the vulnerable permissive insert policy on security_audit_logs.
-- Do not drop the Select policies or admin policies.
DROP POLICY IF EXISTS "Users can insert security audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Auth Insert security_audit_logs" ON public.security_audit_logs;
