-- ====================================================================
-- PHASE 2: FINAL LIVE AUDIT QUERIES
-- This script contains exactly the 5 queries required to safely 
-- audit the live production data without making any modifications.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. NULL Tenant Counts
-- Identifies if tables have records that bypass tenant ownership.
-- --------------------------------------------------------------------
SELECT 'area_problems' as table_name, count(*) as total_rows, count(*) filter (where tenant_id is null) as null_tenant_id_count FROM public.area_problems UNION ALL
SELECT 'event_rsvps', count(*), count(*) filter (where tenant_id is null) FROM public.event_rsvps UNION ALL
SELECT 'letter_requests', count(*), count(*) filter (where tenant_id is null) FROM public.letter_requests UNION ALL
SELECT 'personal_requests', count(*), count(*) filter (where tenant_id is null) FROM public.personal_requests UNION ALL
SELECT 'scheme_applications', count(*), count(*) filter (where tenant_id is null) FROM public.scheme_applications UNION ALL
SELECT 'survey_responses', count(*), count(*) filter (where tenant_id is null) FROM public.survey_responses UNION ALL
SELECT 'tasks', count(*), count(*) filter (where tenant_id is null) FROM public.tasks UNION ALL
SELECT 'sadasya', count(*), count(*) filter (where tenant_id is null) FROM public.sadasya UNION ALL
SELECT 'voter_applications', count(*), count(*) filter (where tenant_id is null) FROM public.voter_applications UNION ALL
SELECT 'work_tracker_history', count(*), count(*) filter (where tenant_id is null) FROM public.work_tracker_history;


-- --------------------------------------------------------------------
-- 2. Cross-Tenant Relationship Mismatch Counts
-- Identifies if child records are incorrectly linked to parents 
-- belonging to a different tenant.
-- --------------------------------------------------------------------
SELECT 'event_rsvps -> events' as relationship, count(*) as mismatch_count FROM public.event_rsvps r JOIN public.events e ON r.event_id = e.id WHERE r.tenant_id IS DISTINCT FROM e.tenant_id UNION ALL
SELECT 'event_rsvps -> voters', count(*) FROM public.event_rsvps r JOIN public.voters v ON r.voter_id = v.id WHERE r.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'scheme_applications -> schemes', count(*) FROM public.scheme_applications sa JOIN public.schemes s ON sa.scheme_id = s.id WHERE sa.tenant_id IS DISTINCT FROM s.tenant_id UNION ALL
SELECT 'scheme_applications -> voters', count(*) FROM public.scheme_applications sa JOIN public.voters v ON sa.voter_id = v.id WHERE sa.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'work_tracker_history -> work_trackers', count(*) FROM public.work_tracker_history wth JOIN public.work_trackers wt ON wth.work_tracker_id = wt.id WHERE wth.tenant_id IS DISTINCT FROM wt.tenant_id UNION ALL
SELECT 'survey_responses -> surveys', count(*) FROM public.survey_responses sr JOIN public.surveys s ON sr.survey_id = s.id WHERE sr.tenant_id IS DISTINCT FROM s.tenant_id UNION ALL
SELECT 'survey_responses -> voters', count(*) FROM public.survey_responses sr JOIN public.voters v ON sr.voter_id = v.id WHERE sr.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'sadasya -> voters', count(*) FROM public.sadasya s JOIN public.voters v ON s.linked_voter_id = v.id WHERE s.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'voter_applications -> voters', count(*) FROM public.voter_applications va JOIN public.voters v ON va.voter_id = v.id WHERE va.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'letter_requests -> voters', count(*) FROM public.letter_requests lr JOIN public.voters v ON lr.voter_id = v.id WHERE lr.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'area_problems -> voters', count(*) FROM public.area_problems ap JOIN public.voters v ON ap.voter_id = v.id WHERE ap.tenant_id IS DISTINCT FROM v.tenant_id UNION ALL
SELECT 'personal_requests -> voters', count(*) FROM public.personal_requests pr JOIN public.voters v ON pr.voter_id = v.id WHERE pr.tenant_id IS DISTINCT FROM v.tenant_id;


-- --------------------------------------------------------------------
-- 3. Current Live RLS State
-- Returns all public tables and their precise RLS enforcement states.
-- --------------------------------------------------------------------
SELECT 
    t.tablename, 
    t.rowsecurity AS rls_enabled,
    p.policyname, 
    p.cmd AS operation, 
    p.qual AS condition, 
    p.with_check AS check_condition
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
ORDER BY t.tablename, p.policyname;


-- --------------------------------------------------------------------
-- 4. Current user_tenant_mapping State
-- Evaluates the core trusted mapping table for corruption/duplicates.
-- --------------------------------------------------------------------
-- 4A. Users assigned to multiple tenants
SELECT user_id, COUNT(tenant_id) as assigned_tenants 
FROM public.user_tenant_mapping 
GROUP BY user_id 
HAVING COUNT(tenant_id) > 1;

-- 4B. Duplicate mapping rows
SELECT user_id, tenant_id, COUNT(*) as duplicates
FROM public.user_tenant_mapping
GROUP BY user_id, tenant_id
HAVING COUNT(*) > 1;

-- 4C. Null mappings
SELECT 
    count(*) filter (where user_id is null) as null_users, 
    count(*) filter (where tenant_id is null) as null_tenants 
FROM public.user_tenant_mapping;


-- --------------------------------------------------------------------
-- 5. whatsapp_sessions RLS State
-- Validates the security state of the sensitive bot sessions table.
-- --------------------------------------------------------------------
SELECT 
    t.tablename, 
    t.rowsecurity AS rls_enabled,
    p.policyname, 
    p.cmd AS operation, 
    p.qual AS condition, 
    p.with_check AS check_condition
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' AND t.tablename = 'whatsapp_sessions';
