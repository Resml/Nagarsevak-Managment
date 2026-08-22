-- 1. Inspect RLS state for all public tables
SELECT 
    t.tablename, 
    t.rowsecurity,
    p.policyname, 
    p.cmd, 
    p.qual, 
    p.with_check
FROM 
    pg_tables t
LEFT JOIN 
    pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE 
    t.schemaname = 'public'
ORDER BY 
    t.tablename, p.policyname;

-- 2. Inspect bot admins
SELECT * FROM bot_admins; -- might not exist yet, so we'll see

-- 3. Inspect whatsapp_sessions
SELECT * FROM whatsapp_sessions;
