-- =============================================================================
-- PHASE 8: SECURITY AUDIT LOGGING RPC (Strictly Authenticated)
-- =============================================================================

BEGIN;

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
    -- 1. Payload and Size Validation
    IF p_event_type IS NULL OR length(p_event_type) = 0 OR length(p_event_type) > 100 THEN
        RAISE EXCEPTION 'Invalid event_type';
    END IF;
    
    IF p_details IS NOT NULL AND length(p_details::text) > 5000 THEN
        RAISE EXCEPTION 'Payload too large';
    END IF;

    -- 2. Identify caller securely via auth.uid()
    v_user_id := auth.uid();
    v_actual_tenant_id := p_tenant_id;

    -- 3. Strict Authentication Requirement
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated users can log security events.';
    END IF;

    -- 4. Tenant Validation for Authenticated Users
    IF p_tenant_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_tenant_mapping 
            WHERE user_id = v_user_id 
            AND tenant_id = p_tenant_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized: User does not belong to the specified tenant.';
        END IF;
    ELSE
        -- Auto-resolve if exactly one tenant
        SELECT tenant_id INTO v_actual_tenant_id 
        FROM public.user_tenant_mapping 
        WHERE user_id = v_user_id 
        LIMIT 1;
    END IF;

    -- 5. Insert the log
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

-- Secure the function against public execution
REVOKE EXECUTE ON FUNCTION public.log_security_event FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event FROM anon;
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

COMMIT;
