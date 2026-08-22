-- Phase 2 - 003 - Global Admin Tables
-- Secures platform-global tables (admin_billing, admin_support_tickets, admin_updates).

-- admin_billing
ALTER TABLE public.admin_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_billing" ON public.admin_billing;

CREATE POLICY "Super Admin Access admin_billing" ON public.admin_billing
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- admin_support_tickets
ALTER TABLE public.admin_support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_support_tickets" ON public.admin_support_tickets;

CREATE POLICY "Super Admin Access admin_support_tickets" ON public.admin_support_tickets
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- admin_updates
ALTER TABLE public.admin_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for admin_updates" ON public.admin_updates;

CREATE POLICY "Super Admin Access admin_updates" ON public.admin_updates
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_tenant_mapping 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
