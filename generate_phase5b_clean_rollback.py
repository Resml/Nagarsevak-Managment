import os

tables = [
  'ai_history', 'complaints', 'election_results', 'event_rsvps', 'events',
  'gallery', 'gb_diary', 'housing_societies', 'improvements', 'incoming_letters',
  'letter_requests', 'letter_types', 'message_logs', 'non_voters', 'personal_requests',
  'sadasya', 'schemes', 'social_organizations', 'survey_responses', 'surveys',
  'tasks', 'visitors', 'voter_applications', 'voters', 'ward_provisions',
  'work_trackers', 'works', 'staff'
]

sql = """-- =============================================================================
-- Phase 5B -- CLEAN ROLLBACK
-- File: phase5b_clean_rollback.sql
--
-- PURPOSE:
--   A purely destructive rollback that only drops Phase 5B policies, functions,
--   and triggers. Because Phase 5B failed to drop the original Phase 4 policies,
--   dropping these overriding policies instantly restores the database to the 
--   known-good Phase 4 state.
--
-- EXECUTION: Manual (Run in Supabase SQL Editor)
-- =============================================================================

BEGIN;

-- 1. Drop Phase 5B Triggers
DROP TRIGGER IF EXISTS trg_validate_staff_permissions ON public.staff;
DROP TRIGGER IF EXISTS trg_prevent_staff_permission_escalation ON public.staff;

-- 2. Drop 112 Phase 5B Policies
"""

drop_count = 0
for table in tables:
    sql += f'-- Table: {table}\n'
    sql += f'DROP POLICY IF EXISTS "Allow select based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow insert based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow update based on tenant_id" ON public.{table};\n'
    sql += f'DROP POLICY IF EXISTS "Allow delete based on tenant_id" ON public.{table};\n\n'
    drop_count += 4

sql += """-- 3. Drop Phase 5B Functions using exact signatures
DROP FUNCTION IF EXISTS public.validate_staff_permissions_entitlement();
DROP FUNCTION IF EXISTS public.prevent_staff_permission_escalation();
DROP FUNCTION IF EXISTS public.has_member_feature_access(UUID, UUID, TEXT);

COMMIT;
"""

with open('migrations/phase5b_clean_rollback.sql', 'w') as f:
    f.write(sql)

print(f"Generated migrations/phase5b_clean_rollback.sql with {drop_count} DROP POLICY statements.")
