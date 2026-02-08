-- Clean up existing improvements by assigning them to a tenant
DO $$
DECLARE
    target_tenant_id UUID;
BEGIN
    -- Get the ID of the first tenant (assuming single tenant usage or primary tenant)
    SELECT id INTO target_tenant_id FROM public.tenants LIMIT 1;

    IF target_tenant_id IS NOT NULL THEN
        -- Update existing improvements that have no tenant_id
        UPDATE public.improvements
        SET tenant_id = target_tenant_id
        WHERE tenant_id IS NULL;
        
        RAISE NOTICE 'Updated existing improvements with tenant_id: %', target_tenant_id;
    ELSE
        RAISE NOTICE 'No tenant found to assign to existing improvements.';
    END IF;
END $$;
