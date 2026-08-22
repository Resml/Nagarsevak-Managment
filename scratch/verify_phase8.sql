-- Check function properties and privileges
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    p.proconfig as config_settings,
    pg_get_function_arguments(p.oid) as arguments,
    aclexplode(p.proacl) as acl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'log_security_event' AND n.nspname = 'public';

-- Check policies on security_audit_logs
SELECT 
    policyname, 
    cmd, 
    roles, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'security_audit_logs' AND schemaname = 'public';
