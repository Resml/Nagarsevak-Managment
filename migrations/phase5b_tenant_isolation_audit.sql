-- =============================================================================
-- Phase 5B -- READ-ONLY Tenant Isolation Audit
-- File: phase5b_tenant_isolation_audit.sql
--
-- PURPOSE:
--   Diagnose the "utm.tenant_id = utm.tenant_id" scoping bug in the Phase 5B 
--   RLS policies.
--
-- SAFE: Read-only. Zero DDL, DML, or modification statements.
-- =============================================================================

-- 1. Find and report every Phase 5B policy containing the tautology
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE policyname LIKE 'Allow % based on tenant_id'
  AND (qual LIKE '%utm.tenant_id = utm.tenant_id%' 
       OR with_check LIKE '%utm.tenant_id = utm.tenant_id%')
ORDER BY tablename, cmd;

-- 2. Count policies
SELECT 
    'Total Phase 5B policies' AS metric,
    COUNT(*) AS value
FROM pg_policies
WHERE policyname LIKE 'Allow % based on tenant_id'
UNION ALL
SELECT 
    'Policies with tautological utm.tenant_id = utm.tenant_id',
    COUNT(*)
FROM pg_policies
WHERE policyname LIKE 'Allow % based on tenant_id'
  AND (qual LIKE '%utm.tenant_id = utm.tenant_id%' 
       OR with_check LIKE '%utm.tenant_id = utm.tenant_id%')
UNION ALL
SELECT 
    'Policies with correct tenant correlation (e.g. table.tenant_id)',
    COUNT(*)
FROM pg_policies
WHERE policyname LIKE 'Allow % based on tenant_id'
  AND (qual LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%' 
       OR with_check LIKE '%utm.tenant_id = ' || tablename || '.tenant_id%');
