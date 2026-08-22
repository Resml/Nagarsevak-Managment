-- ====================================================================
-- PHASE 2: STEP 1 - LIVE RLS INSPECTION
-- This script is READ-ONLY. It extracts the current state of RLS 
-- on all tenant tables to produce the requested audit table.
-- ====================================================================

-- 1. Check RLS enabled state and policy definitions for all tables
SELECT 
    t.tablename, 
    t.rowsecurity AS rls_enabled,
    p.policyname, 
    p.cmd AS operation, 
    p.qual AS condition, 
    p.with_check AS check_condition
FROM 
    pg_tables t
LEFT JOIN 
    pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE 
    t.schemaname = 'public'
ORDER BY 
    t.tablename, p.policyname;

-- 2. Inspect user_tenant_mapping structure and state
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_tenant_mapping'
ORDER BY ordinal_position;

-- 3. Check for multiple tenant assignments per user
SELECT user_id, COUNT(tenant_id) as tenant_count
FROM user_tenant_mapping
GROUP BY user_id
HAVING COUNT(tenant_id) > 1;

-- 4. Check for duplicate user -> tenant mappings
SELECT user_id, tenant_id, COUNT(*) as duplicates
FROM user_tenant_mapping
GROUP BY user_id, tenant_id
HAVING COUNT(*) > 1;

-- 5. Inspect whatsapp_sessions
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_sessions';

-- 6. Check storage policies (for gallery, complaints, etc.)
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
