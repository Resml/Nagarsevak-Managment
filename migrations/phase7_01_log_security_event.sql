-- =============================================================================
-- PHASE 7/8 BOUNDARY: SECURITY AUDIT LOGGING RPC
-- STATUS: DEFERRED / NOT DEPLOYED
-- =============================================================================
-- This file contains the design for the log_security_event RPC.
-- Per F-04, this should NOT be executed in production yet, as we need to update
-- all frontend components to use the RPC before dropping the Auth Insert policy.

-- Create the RPC as SECURITY DEFINER so clients can write to the audit log
-- without needing INSERT permissions on the table directly.
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text,
    p_details jsonb,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_actual_tenant_id uuid;
BEGIN
    -- 1. Identify caller securely via auth.uid()
    v_user_id := auth.uid();
    v_actual_tenant_id := p_tenant_id;

    -- 2. If authenticated, enforce tenant mapping 
    IF v_user_id IS NOT NULL THEN
        -- Prevent spoofing: if a tenant_id is provided, assert they actually belong to it
        IF p_tenant_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.user_tenant_mapping 
                WHERE user_id = v_user_id 
                AND tenant_id = p_tenant_id
            ) THEN
                RAISE EXCEPTION 'Unauthorized: User does not belong to the specified tenant.';
            END IF;
        ELSE
            -- Auto-resolve tenant_id if missing but user is mapped to exactly one tenant
            SELECT tenant_id INTO v_actual_tenant_id 
            FROM public.user_tenant_mapping 
            WHERE user_id = v_user_id 
            LIMIT 1;
        END IF;
    END IF;

    -- 3. Insert the log
    INSERT INTO public.security_audit_logs (
        user_id,
        tenant_id,
        event_type,
        details
    ) VALUES (
        v_user_id,
        v_actual_tenant_id,
        p_event_type,
        p_details
    );
END;
$$;

-- Secure the function against public execution (must be authenticated or anon)
REVOKE EXECUTE ON FUNCTION public.log_security_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO anon;

-- NOTE: The following DROP command is intentionally commented out for Phase 7.
-- It MUST NOT be executed until all clients are migrated to use the RPC above.
-- DROP POLICY IF EXISTS "Auth Insert security_audit_logs" ON public.security_audit_logs;
