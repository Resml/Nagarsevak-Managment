
DO \$\$
DECLARE
    v_qual TEXT;
BEGIN
    SELECT qual INTO v_qual FROM pg_policies WHERE policyname = 'Tenant Isolation Update' AND tablename = 'staff';
    RAISE NOTICE 'Normalized qual for staff update: %', v_qual;
END \$\$;
