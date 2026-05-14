-- SQL Script to create login_logs table
-- Execute this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    status TEXT DEFAULT 'success',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own login logs
CREATE POLICY "Users can view their own login logs"
ON public.login_logs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Nagarsevak can view all logs for their tenant
CREATE POLICY "Nagarsevak can view all login logs for their tenant"
ON public.login_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_tenant_mapping
        WHERE user_id = auth.uid()
        AND tenant_id = login_logs.tenant_id
        AND role = 'nagarsevak'
    )
);

-- Policy: System can insert logs (service role or authenticated for self-logging)
CREATE POLICY "Users can insert their own login logs"
ON public.login_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.login_logs TO authenticated;
GRANT ALL ON public.login_logs TO service_role;
