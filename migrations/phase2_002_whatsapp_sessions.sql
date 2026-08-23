-- Phase 2 - 002 - Whatsapp Sessions Security
-- Locks down Bot session data. Only Render Server via SUPABASE_SERVICE_ROLE_KEY can access.

-- Explicitly drop the highly insecure public access policy
DROP POLICY IF EXISTS "Allow all access to whatsapp_sessions" ON public.whatsapp_sessions;

-- Ensure RLS is enabled so dropping the policy results in default-deny for web clients
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Note: We intentionally do NOT create a replacement policy.
-- The service_role key natively bypasses RLS.
