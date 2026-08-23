-- ====================================================================
-- PHASE 2: FK / TENANT OWNERSHIP AUDIT & NULL TENANT AUDIT
-- This script is READ-ONLY. It extracts schema foreign keys, column 
-- info, and tests existing data for cross-tenant mismatches.
-- ====================================================================

-- 1. Identify all tables and whether they have a tenant_id column
SELECT 
    t.table_name,
    CASE WHEN c.column_name IS NOT NULL THEN true ELSE false END as has_tenant_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'tenant_id'
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2. Extract all foreign keys between public tables
SELECT
    tc.table_name AS child_table,
    kcu.column_name AS child_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS parent_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 3. NULL Tenant Audit
-- Generate the counts for NULL tenant_id rows across all tables.
-- (This block outputs dynamic SQL queries. You must run the output of this query as a new query to get actual counts, 
--  OR if your SQL editor supports it, review it. Alternatively, I have written explicit counts for known tables below).

SELECT 'SELECT count(*) as count_nulls, ''' || table_name || ''' as table_name FROM public.' || table_name || ' WHERE tenant_id IS NULL;'
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'tenant_id';

-- 4. Cross-Tenant Data Mismatch Detection
-- These queries check if a child table with a tenant_id references a parent that belongs to a different tenant.

-- A) event_rsvps -> events mismatch
SELECT count(*) as mismatch_count, 'event_rsvps -> events' as relationship 
FROM public.event_rsvps r
JOIN public.events e ON r.event_id = e.id
WHERE r.tenant_id IS DISTINCT FROM e.tenant_id;

-- B) event_rsvps -> voters mismatch
SELECT count(*) as mismatch_count, 'event_rsvps -> voters' as relationship 
FROM public.event_rsvps r
JOIN public.voters v ON r.voter_id = v.id
WHERE r.tenant_id IS DISTINCT FROM v.tenant_id;

-- C) area_problems -> voters mismatch
SELECT count(*) as mismatch_count, 'area_problems -> voters' as relationship 
FROM public.area_problems p
JOIN public.voters v ON p.voter_id = v.id
WHERE p.tenant_id IS DISTINCT FROM v.tenant_id;

-- D) letter_requests -> voters mismatch
SELECT count(*) as mismatch_count, 'letter_requests -> voters' as relationship 
FROM public.letter_requests l
JOIN public.voters v ON l.voter_id = v.id
WHERE l.tenant_id IS DISTINCT FROM v.tenant_id;

-- E) personal_requests -> voters mismatch
SELECT count(*) as mismatch_count, 'personal_requests -> voters' as relationship 
FROM public.personal_requests pr
JOIN public.voters v ON pr.voter_id = v.id
WHERE pr.tenant_id IS DISTINCT FROM v.tenant_id;

-- F) scheme_applications -> schemes mismatch
SELECT count(*) as mismatch_count, 'scheme_applications -> schemes' as relationship 
FROM public.scheme_applications sa
JOIN public.schemes s ON sa.scheme_id = s.id
WHERE sa.tenant_id IS DISTINCT FROM s.tenant_id;

-- G) scheme_applications -> voters mismatch
SELECT count(*) as mismatch_count, 'scheme_applications -> voters' as relationship 
FROM public.scheme_applications sa
JOIN public.voters v ON sa.voter_id = v.id
WHERE sa.tenant_id IS DISTINCT FROM v.tenant_id;

-- H) survey_responses -> voters mismatch
-- Assuming survey_responses has no tenant_id, we check if the survey's tenant matches the voter's tenant
SELECT count(*) as mismatch_count, 'survey_responses (survey <-> voter)' as relationship 
FROM public.survey_responses sr
JOIN public.surveys s ON sr.survey_id = s.id
JOIN public.voters v ON sr.voter_id = v.id
WHERE s.tenant_id IS DISTINCT FROM v.tenant_id;
