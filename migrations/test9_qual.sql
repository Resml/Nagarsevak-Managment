
DO \$\$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE (policyname LIKE 'Tenant Isolation %' OR policyname LIKE 'Users can % election results for their tenant')
      AND cmd IN ('SELECT', 'DELETE')
      AND qual LIKE '%user_tenant_mapping%tenant_id%';
    RAISE NOTICE 'Matched SELECT/DELETE: %', v_count;
END \$\$;
