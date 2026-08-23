-- Phase 2 - 001 - Tenant Helper
-- Creates the authoritative, secure helper for server-side tenant identification.
-- Depends on: public.user_tenant_mapping

CREATE OR REPLACE FUNCTION public.get_authorized_tenants()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id
  FROM public.user_tenant_mapping
  WHERE user_id = auth.uid();
$$;

-- Secure the function permissions
REVOKE ALL ON FUNCTION public.get_authorized_tenants() FROM public;
GRANT EXECUTE ON FUNCTION public.get_authorized_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_authorized_tenants() TO service_role;
