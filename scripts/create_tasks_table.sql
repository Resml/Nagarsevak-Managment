
-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    due_date DATE,
    due_time TIME,
    address TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'In Progress')),
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts/errors
DROP POLICY IF EXISTS "Enable all access for tenant users" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Isolation Select" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Isolation Insert" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Isolation Update" ON public.tasks;
DROP POLICY IF EXISTS "Tenant Isolation Delete" ON public.tasks;

-- Create correct policies based on user_tenant_mapping
CREATE POLICY "Tenant Isolation Select" ON public.tasks FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Insert" ON public.tasks FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Update" ON public.tasks FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Isolation Delete" ON public.tasks FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM user_tenant_mapping WHERE user_id = auth.uid())
);

-- Add index
CREATE INDEX IF NOT EXISTS tasks_tenant_id_idx ON public.tasks(tenant_id);
